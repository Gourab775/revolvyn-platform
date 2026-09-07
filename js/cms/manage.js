/* REVOLVYN Website Manager — plain-language CMS. No tech jargon in the UI. */
(function () {
  'use strict';
  var clerk = null, token = null, draft = null, tab = 'home', dirty = false, busy = false;
  var uploadsOn = false;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var LABELS = {
    tag: 'Top label', heading: 'Heading', description: 'Description',
    buttonText: 'Button text', buttonUrl: 'Button link', label: 'Small label',
    quote: 'Quote', attribution: 'Who said it', brandName: 'Brand name',
    brandDescription: 'Short description', title: 'Title', name: 'Name',
    thumbnail: 'Photo / thumbnail', video_url: 'Video link', video: 'Video link',
    external_url: 'Link (opens when clicked)', client_name: 'Client name',
    category: 'Category', logo: 'Logo image', website_url: 'Website link',
    image: 'Image', icon: 'Icon (emoji or symbol)', content: 'What they said',
    company: 'Company', role: 'Role', photo: 'Photo'
  };
  var label = function (k) { return LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };

  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  function show(id) {
    ['screen-loading', 'screen-signin', 'screen-denied', 'screen-cms'].forEach(function (s) {
      $(s).classList.toggle('hidden', s !== id);
    });
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var res = await fetch(path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    var data = null;
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) {
      var err = new Error((data && data.error) || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return data || {};
  }

  function setBusy(b, btn, text) {
    busy = b;
    if (btn) { btn.disabled = b; if (text) btn.dataset.orig = btn.dataset.orig || btn.textContent; btn.textContent = b ? text : (btn.dataset.orig || btn.textContent); }
  }

  function markDirty() {
    dirty = true;
    renderPill();
  }
  function renderPill() {
    var pill = $('status-pill');
    var any = dirty || (draft && anyUnpublished(draft));
    pill.textContent = any ? 'Unpublished changes' : 'All published';
    pill.className = 'pill ' + (any ? 'dirty' : 'clean');
  }
  function anyUnpublished(d) {
    var lists = ['sections', 'portfolio', 'brands', 'services', 'testimonials'];
    for (var i = 0; i < lists.length; i++) {
      var arr = d[lists[i]] || [];
      for (var j = 0; j < arr.length; j++) if (arr[j].has_unpublished_changes) return true;
    }
    return (d.settings || []).some(function (s) { return s.has_unpublished_changes; });
  }

  function signinFail(message, showRetry) {
    $('signin-error').textContent = message;
    $('signin-error').classList.remove('hidden');
    $('btn-retry').classList.toggle('hidden', !showRetry);
    show('screen-signin');
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  async function boot() {
    // Step 1: reach the server and read public config. Three distinct
    // outcomes, three distinct messages — never blame setup for a network
    // problem (e.g. a hosting login wall in front of the site).
    var cfg = null, problem = '';
    try {
      var res = await fetch('/api/public/config', { cache: 'no-store' });
      var text = await res.text();
      try {
        cfg = JSON.parse(text);
      } catch (e) {
        problem = 'wall'; // reachable, but answered HTML (login wall / proxy)
      }
      if (cfg && !res.ok) problem = 'http';
    } catch (e) {
      problem = 'network'; // DNS / offline / blocked request
    }
    if (problem === 'wall' || problem === 'network') {
      console.error('[Website Manager] config fetch failed:', problem);
      signinFail(
        'The manager could not reach the website server. ' +
        'Check your internet connection and refresh. If this keeps happening, ' +
        'the site may be behind a hosting login screen — ask your developer ' +
        'to turn off Deployment Protection.',
        true,
      );
      return;
    }
    if (problem === 'http' || !cfg || !cfg.manageEnabled) {
      console.error('[Website Manager] server reachable but sign-in is not configured.');
      signinFail('The website manager is not set up yet. Please ask your developer to connect sign-in first.', true);
      return;
    }
    uploadsOn = !!cfg.uploadsEnabled;
    var key = cfg.clerkPublishableKey;
    var attempts = 0;
    while (!window.Clerk && attempts < 100) { await new Promise(function (r) { setTimeout(r, 100); }); attempts++; }
    if (!window.Clerk) {
      signinFail('Could not load the sign-in box. Check your connection and try again.', true);
      return;
    }
    clerk = window.Clerk;
    await clerk.load({ publishableKey: key });
    if (!clerk.user) {
      show('screen-signin');
      clerk.mountSignIn($('clerk-signin'), { afterSignInUrl: '/manage', afterSignUpUrl: '/manage' });
      return;
    }
    await enter();
  }

  async function enter() {
    token = await clerk.session.getToken();
    setInterval(async function () { try { token = await clerk.session.getToken(); } catch (e) {} }, 50000);
    try {
      var me = await api('/api/cms/me');
      toast('Welcome back' + (me.user && me.user.email ? ', ' + me.user.email : '') + ' ✓');
    } catch (e) {
      if (e.status === 403) { show('screen-denied'); return; }
      signinFail(e.message, true);
      return;
    }
    await reload();
    show('screen-cms');
    render();
  }

  async function reload() {
    draft = await api('/api/cms/draft');
    dirty = false;
    renderPill();
  }

  // ── Generic modal editor ────────────────────────────────────────────────
  var modalSave = null;
  function openEditor(title, fields, values, onSave) {
    $('modal-title').textContent = title;
    var wrap = $('modal-fields');
    wrap.innerHTML = '';
    fields.forEach(function (f) {
      var div = document.createElement('div');
      div.className = 'field';
      var lab = document.createElement('label');
      lab.textContent = f.label || label(f.key);
      div.appendChild(lab);
      var val = values[f.key] == null ? '' : values[f.key];
      if (f.type === 'textarea') {
        var ta = document.createElement('textarea');
        ta.value = val; ta.dataset.key = f.key; div.appendChild(ta);
      } else if (f.type === 'image' || f.type === 'video') {
        div.appendChild(mediaWidget(f.key, val, f.type));
      } else {
        var inp = document.createElement('input');
        inp.type = 'text'; inp.value = val; inp.dataset.key = f.key;
        inp.placeholder = f.placeholder || '';
        div.appendChild(inp);
      }
      if (f.tip) { var h = document.createElement('div'); h.className = 'hint'; h.textContent = f.tip; div.appendChild(h); }
      wrap.appendChild(div);
    });
    $('modal').classList.remove('hidden');
    modalSave = async function () {
      var out = {};
      wrap.querySelectorAll('[data-key]').forEach(function (el) { out[el.dataset.key] = el.value; });
      await onSave(out);
    };
  }

  function mediaWidget(key, val, kind) {
    var box = document.createElement('div');
    var render = function (v) {
      box.innerHTML = '';
      if (v) {
        var prev = document.createElement(kind === 'video' ? 'video' : 'img');
        prev.src = v; prev.className = 'thumb'; if (kind === 'video') { prev.controls = true; prev.muted = true; }
        box.appendChild(prev);
      }
      var hidden = document.createElement('input');
      hidden.type = 'hidden'; hidden.dataset.key = key; hidden.value = v || '';
      box.appendChild(hidden);
      var row = document.createElement('div');
      row.className = 'row-actions';
      var rep = document.createElement('button');
      rep.className = 'btn small ghost'; rep.type = 'button';
      rep.textContent = v ? (kind === 'video' ? 'Change video' : 'Replace image') : (kind === 'video' ? 'Add video' : 'Add image');
      rep.onclick = function () { replaceMedia(key, kind, function (nv) { render(nv); markDirty(); }); };
      row.appendChild(rep);
      if (v) {
        var rm = document.createElement('button');
        rm.className = 'btn small ghost'; rm.type = 'button'; rm.textContent = 'Remove';
        rm.onclick = function () { render(''); markDirty(); };
        row.appendChild(rm);
      }
      box.appendChild(row);
      if (!uploadsOn) {
        var h = document.createElement('div');
        h.className = 'hint';
        h.textContent = 'Tip: paste an image/video link, or ask your developer to enable file uploads.';
        box.appendChild(h);
        var link = document.createElement('input');
        link.type = 'text'; link.placeholder = 'Paste link here…'; link.value = (v || '');
        link.style.marginTop = '8px';
        link.onchange = function () { render(link.value.trim()); markDirty(); };
        box.appendChild(link);
      }
    };
    render(val);
    return box;
  }

  async function replaceMedia(key, kind, done) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'video' ? 'video/*' : 'image/*';
    input.onchange = async function () {
      var file = input.files[0];
      if (!file) return;
      if (file.size > 100 * 1024 * 1024) { toast('That file is too large (max 100 MB).', true); return; }
      if (!uploadsOn) {
        var url = prompt('File uploads are not enabled. Paste a link to the ' + kind + ' instead:');
        if (url) done(url.trim());
        return;
      }
      toast('Uploading…');
      try {
        var sign = await api('/api/cms/upload-sign', { method: 'POST', body: { folder: 'revolvyn' } });
        var fd = new FormData();
        fd.append('file', file);
        fd.append('api_key', sign.apiKey);
        fd.append('timestamp', sign.timestamp);
        fd.append('signature', sign.signature);
        fd.append('folder', sign.folder);
        var up = await fetch('https://api.cloudinary.com/v1_1/' + sign.cloudName + '/auto/upload', { method: 'POST', body: fd });
        var jd = await up.json();
        if (!up.ok) throw new Error('Upload failed. Please try again.');
        toast('Uploaded ✓');
        done(jd.secure_url);
      } catch (e) { toast(e.message, true); }
    };
    input.click();
  }

  function confirmDialog(title, text, okLabel) {
    return new Promise(function (resolve) {
      $('confirm-title').textContent = title;
      $('confirm-text').textContent = text;
      $('confirm-ok').textContent = okLabel || 'Delete';
      $('confirm').classList.remove('hidden');
      $('confirm-ok').onclick = function () { $('confirm').classList.add('hidden'); resolve(true); };
      $('confirm-cancel').onclick = function () { $('confirm').classList.add('hidden'); resolve(false); };
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function render() {
    document.querySelectorAll('.side-link').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    var c = $('tab-content');
    c.innerHTML = '';
    if (!draft) { c.innerHTML = '<p class="muted">Loading…</p>'; return; }
    if (tab === 'home') renderHome(c);
    else if (tab === 'portfolio') renderList(c, 'portfolio', 'Portfolio', 'Project', portfolioFields);
    else if (tab === 'brands') renderList(c, 'brands', 'Brands', 'Brand', brandFields);
    else if (tab === 'services') renderList(c, 'services', 'Services', 'Service', serviceFields);
    else if (tab === 'testimonials') renderList(c, 'testimonials', 'Testimonials', 'Testimonial', testimonialFields);
    else if (tab === 'contact') renderContact(c);
    else if (tab === 'history') renderHistory(c);
    else if (tab === 'activity') renderActivity(c);
    renderPill();
  }

  function sectionCard(parent, page, keys, title, tip) {
    var secs = (draft.sections || []).filter(function (s) { return s.page_slug === page && keys.indexOf(s.section_key) >= 0; });
    secs.sort(function (a, b) { return a.sort_order - b.sort_order; });
    var h = document.createElement('h3'); h.textContent = title; parent.appendChild(h);
    if (tip) { var p = document.createElement('p'); p.className = 'muted'; p.textContent = tip; parent.appendChild(p); }
    if (!secs.length) { parent.appendChild(emptyBox('Nothing here yet.')); return; }
    secs.forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'card';
      var head = document.createElement('div');
      head.className = 'card-head';
      head.innerHTML = '<span class="card-title">' + esc(label(s.section_key)) + '</span>';
      var acts = document.createElement('div');
      acts.className = 'row-actions';
      var vis = document.createElement('button');
      vis.className = 'btn small ghost';
      vis.textContent = s.is_visible ? 'Hide' : 'Show';
      vis.onclick = function () { saveSections([{ id: s.id, data: s.data, is_visible: !s.is_visible }]); };
      var ed = document.createElement('button');
      ed.className = 'btn small ghost'; ed.textContent = 'Edit';
      ed.onclick = function () { editSection(s); };
      acts.appendChild(vis); acts.appendChild(ed);
      head.appendChild(acts);
      card.appendChild(head);
      var prev = document.createElement('div');
      prev.className = 'muted';
      prev.textContent = previewText(s.data);
      card.appendChild(prev);
      if (!s.is_visible) { var b = document.createElement('span'); b.className = 'badge off'; b.textContent = 'Hidden'; card.appendChild(b); }
      parent.appendChild(card);
    });
  }

  function previewText(data) {
    var picks = ['heading', 'description', 'quote', 'tag', 'buttonText', 'brandDescription', 'label'];
    for (var i = 0; i < picks.length; i++) {
      if (data[picks[i]]) return String(data[picks[i]]).slice(0, 140);
    }
    return Object.values(data || {}).map(String).join(' ').slice(0, 140) || '—';
  }

  function editSection(s) {
    var keys = Object.keys(s.data || {});
    if (!keys.length) keys = ['heading', 'description'];
    var fields = keys.map(function (k) {
      var isUrl = /url|image|logo|video|thumbnail|website/i.test(k);
      var long = String(s.data[k] || '').length > 80 || /description|quote|heading/i.test(k);
      return { key: k, type: isUrl ? 'image' : (long ? 'textarea' : 'text') };
    });
    openEditor('Edit — ' + label(s.section_key), fields, s.data || {}, async function (out) {
      await saveSections([{ id: s.id, data: out }]);
      $('modal').classList.add('hidden');
    });
  }

  async function saveSections(sections) {
    try {
      var r = await api('/api/cms/sections', { method: 'PATCH', body: { sections: sections } });
      (r.sections || []).forEach(function (ns) {
        var i = draft.sections.findIndex(function (x) { return x.id === ns.id; });
        if (i >= 0) draft.sections[i] = Object.assign({}, draft.sections[i], ns);
      });
      markDirty(); render(); toast('Saved ✓ (not live until you Publish)');
    } catch (e) { toast(e.message, true); }
  }

  function renderHome(c) {
    var h = document.createElement('h2'); h.textContent = 'Home page'; c.appendChild(h);
    var p = document.createElement('p'); p.className = 'muted';
    p.textContent = 'Change words and pictures. Nothing goes live until you press “Publish changes”.';
    c.appendChild(p);
    sectionCard(c, 'home', ['hero'], 'Top of the page');
    sectionCard(c, 'home', ['manifesto'], 'About text');
    sectionCard(c, 'home', ['quote'], 'Quote');
    sectionCard(c, 'home', ['cta'], 'Contact button area');
    sectionCard(c, 'home', ['footer'], 'Footer');
  }

  // ── Collection lists ────────────────────────────────────────────────────
  function portfolioFields() {
    return [
      { key: 'title', label: 'Title' },
      { key: 'description', type: 'textarea' },
      { key: 'video_url', type: 'video', label: 'Video' },
      { key: 'thumbnail', type: 'image', label: 'Thumbnail photo' },
      { key: 'client_name', label: 'Client name' },
      { key: 'category', label: 'Category' },
      { key: 'external_url', label: 'Link (optional)' }
    ];
  }
  function brandFields() {
    return [
      { key: 'name', label: 'Brand name' },
      { key: 'logo', type: 'image', label: 'Logo' },
      { key: 'website_url', label: 'Website link (optional)' }
    ];
  }
  function serviceFields() {
    return [
      { key: 'title', label: 'Service name' },
      { key: 'description', type: 'textarea' },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'icon', label: 'Icon (optional, e.g. ✦)' }
    ];
  }
  function testimonialFields() {
    return [
      { key: 'content', type: 'textarea', label: 'What they said' },
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company' },
      { key: 'role', label: 'Role' },
      { key: 'photo', type: 'image', label: 'Photo (optional)' }
    ];
  }

  function renderList(c, resource, plural, single, fieldsFn) {
    var items = (draft[resource] || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
    var head = document.createElement('div');
    head.className = 'list-head';
    head.innerHTML = '<h2>' + esc(plural) + '</h2>';
    var add = document.createElement('button');
    add.className = 'btn primary'; add.textContent = '+ Add ' + single;
    add.onclick = function () {
      openEditor('Add ' + single, fieldsFn(), {}, async function (out) {
        try {
          var r = await api('/api/cms/' + resource, { method: 'POST', body: out });
          draft[resource].push(r.item);
          markDirty(); $('modal').classList.add('hidden'); render(); toast('Added ✓ (not live until you Publish)');
        } catch (e) { toast(e.message, true); }
      });
    };
    head.appendChild(add);
    c.appendChild(head);
    var tip = document.createElement('p');
    tip.className = 'muted';
    tip.textContent = 'Drag order with “Move up / down”. Hidden items stay saved but visitors can’t see them after Publish.';
    c.appendChild(tip);
    if (!items.length) {
      c.appendChild(emptyBox('No ' + plural.toLowerCase() + ' yet.', '+ Add ' + single, function () { add.click(); }));
      return;
    }
    items.forEach(function (it, idx) {
      var card = document.createElement('div');
      card.className = 'card';
      var head2 = document.createElement('div');
      head2.className = 'card-head';
      var title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = it.title || it.name || single + ' ' + (idx + 1);
      head2.appendChild(title);
      var acts = document.createElement('div');
      acts.className = 'row-actions';
      var up = btn('↑', function () { move(resource, it, -1); }); up.title = 'Move up';
      var dn = btn('↓', function () { move(resource, it, 1); }); dn.title = 'Move down';
      var vs = btn(it.is_visible ? 'Hide' : 'Show', function () { toggleVis(resource, it); });
      var ed = btn('Edit', function () {
        openEditor('Edit — ' + (it.title || it.name || single), fieldsFn(), it, async function (out) {
          out.id = it.id;
          try {
            var r = await api('/api/cms/' + resource, { method: 'PATCH', body: out });
            Object.assign(it, r.item);
            markDirty(); $('modal').classList.add('hidden'); render(); toast('Saved ✓ (not live until you Publish)');
          } catch (e) { toast(e.message, true); }
        });
      });
      var del = btn('Delete', async function () {
        var ok = await confirmDialog('Delete this ' + single.toLowerCase() + '?', '“' + (it.title || it.name || '') + '” will be removed. This cannot be undone.', 'Delete');
        if (!ok) return;
        try {
          await api('/api/cms/' + resource + '?id=' + it.id, { method: 'DELETE' });
          draft[resource] = draft[resource].filter(function (x) { return x.id !== it.id; });
          markDirty(); render(); toast('Deleted ✓ (not live until you Publish)');
        } catch (e) { toast(e.message, true); }
      });
      [up, dn, vs, ed, del].forEach(function (b) { b.classList.add('small', 'ghost'); acts.appendChild(b); });
      head2.appendChild(acts);
      card.appendChild(head2);
      var img = it.thumbnail || it.logo || it.image || it.photo || '';
      if (img) {
        var im = document.createElement('img');
        im.src = img; im.className = 'thumb' + (resource === 'brands' ? ' logo' : '');
        im.alt = '';
        card.appendChild(im);
      }
      if (it.description || it.content) {
        var d = document.createElement('div');
        d.className = 'muted';
        d.textContent = String(it.description || it.content).slice(0, 160);
        card.appendChild(d);
      }
      if (!it.is_visible) { var bdg = document.createElement('span'); bdg.className = 'badge off'; bdg.textContent = 'Hidden from visitors'; card.appendChild(bdg); }
      c.appendChild(card);
    });
  }

  function btn(t, fn) { var b = document.createElement('button'); b.className = 'btn'; b.textContent = t; b.onclick = fn; return b; }

  function emptyBox(text, actionText, actionFn) {
    var d = document.createElement('div');
    d.className = 'empty';
    d.innerHTML = '<p>' + esc(text) + '</p>';
    if (actionText) {
      var b = document.createElement('button');
      b.className = 'btn primary'; b.textContent = actionText;
      b.onclick = actionFn; d.appendChild(b);
    }
    return d;
  }

  async function move(resource, it, dir) {
    var items = draft[resource].slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
    var i = items.findIndex(function (x) { return x.id === it.id; });
    var j = i + dir;
    if (j < 0 || j >= items.length) return;
    var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    try {
      await api('/api/cms/' + resource + '?action=reorder', { method: 'PATCH', body: { order: items.map(function (x) { return x.id; }) } });
      items.forEach(function (x, k) { x.sort_order = k; var o = draft[resource].find(function (y) { return y.id === x.id; }); if (o) o.sort_order = k; });
      markDirty(); render(); toast('Moved ✓');
    } catch (e) { toast(e.message, true); }
  }

  async function toggleVis(resource, it) {
    try {
      var r = await api('/api/cms/' + resource, { method: 'PATCH', body: { id: it.id, is_visible: !it.is_visible } });
      Object.assign(it, r.item);
      markDirty(); render(); toast(it.is_visible ? 'Visible ✓' : 'Hidden ✓');
    } catch (e) { toast(e.message, true); }
  }

  // ── Contact & settings ──────────────────────────────────────────────────
  var SETTING_LABELS = {
    'contact.email': 'Contact email', 'contact.phone': 'Phone number',
    'contact.office': 'Office / address', 'contact.hours': 'Opening hours',
    'social.instagram': 'Instagram link', 'social.facebook': 'Facebook link',
    'social.youtube': 'YouTube link', 'footer.tagline': 'Footer tagline',
    'footer.copyright': 'Footer copyright line'
  };
  function renderContact(c) {
    var h = document.createElement('h2'); h.textContent = 'Contact & details'; c.appendChild(h);
    var p = document.createElement('p'); p.className = 'muted';
    p.textContent = 'Email, phone, address and social links shown across the website.';
    c.appendChild(p);
    var vals = {};
    (draft.settings || []).forEach(function (s) {
      vals[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
    });
    var fields = Object.keys(SETTING_LABELS).map(function (k) { return { key: k, label: SETTING_LABELS[k] }; });
    var box = document.createElement('div');
    box.className = 'card';
    fields.forEach(function (f) {
      var div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = '<label>' + esc(f.label) + '</label>';
      var inp = document.createElement('input');
      inp.type = 'text'; inp.value = vals[f.key] || ''; inp.dataset.key = f.key;
      div.appendChild(inp);
      box.appendChild(div);
    });
    var save = document.createElement('button');
    save.className = 'btn primary'; save.textContent = 'Save details';
    save.onclick = async function () {
      var out = {};
      box.querySelectorAll('[data-key]').forEach(function (el) { out[el.dataset.key] = el.value; });
      setBusy(true, save, 'Saving…');
      try {
        var r = await api('/api/cms/settings', { method: 'PATCH', body: { settings: out } });
        (r.settings || []).forEach(function (ns) {
          var i = draft.settings.findIndex(function (x) { return x.key === ns.key; });
          if (i >= 0) draft.settings[i] = ns; else draft.settings.push(ns);
        });
        markDirty(); render(); toast('Saved ✓ (not live until you Publish)');
      } catch (e) { toast(e.message, true); }
      setBusy(false, save);
    };
    box.appendChild(save);
    c.appendChild(box);
  }

  // ── History / activity ──────────────────────────────────────────────────
  async function renderHistory(c) {
    c.innerHTML = '<h2>Version history</h2><p class="muted">Every Publish saves a snapshot. Restoring puts a version back into drafts — it only goes live after you Publish again.</p>';
    var list = document.createElement('div');
    list.innerHTML = '<p class="muted">Loading…</p>';
    c.appendChild(list);
    try {
      var r = await api('/api/cms/versions');
      list.innerHTML = '';
      if (!r.versions.length) { list.appendChild(emptyBox('No versions yet. They appear after your first Publish.')); return; }
      r.versions.forEach(function (v) {
        var row = document.createElement('div');
        row.className = 'ver-row';
        var when = new Date(v.created_at);
        row.innerHTML = '<span>' + esc(v.note || 'Snapshot') + ' — ' + esc(when.toLocaleString()) + '</span>';
        var rb = document.createElement('button');
        rb.className = 'btn small ghost'; rb.textContent = 'Restore to drafts';
        rb.onclick = async function () {
          var ok = await confirmDialog('Restore this version?', 'Your current drafts will be replaced by this snapshot. History is kept — nothing is lost. You still need to Publish to go live.', 'Restore');
          if (!ok) return;
          try {
            await api('/api/cms/versions', { method: 'POST', body: { version_id: v.id } });
            await reload(); render(); toast('Restored to drafts ✓ — press Publish to go live');
          } catch (e) { toast(e.message, true); }
        };
        row.appendChild(rb);
        list.appendChild(row);
      });
    } catch (e) { list.innerHTML = '<p class="error">' + esc(e.message) + '</p>'; }
  }

  async function renderActivity(c) {
    c.innerHTML = '<h2>Recent activity</h2><p class="muted">Who changed what, and when.</p>';
    var list = document.createElement('div');
    list.innerHTML = '<p class="muted">Loading…</p>';
    c.appendChild(list);
    try {
      var r = await api('/api/cms/audit');
      list.innerHTML = '';
      if (!r.log.length) { list.appendChild(emptyBox('No activity yet.')); return; }
      var words = { create: 'added', update: 'updated', delete: 'deleted', publish: 'published changes', restore: 'restored a version', reorder: 'reordered', access: 'signed in', bootstrap_owner: 'claimed owner access' };
      r.log.forEach(function (a) {
        var row = document.createElement('div');
        row.className = 'log-row';
        var what = (words[a.action] || a.action) + (a.entity_type && a.entity_type !== 'session' ? ' ' + a.entity_type : '');
        row.innerHTML = '<span>' + esc(a.actor || 'Someone') + ' ' + esc(what) + '</span><span class="muted">' + esc(new Date(a.created_at).toLocaleString()) + '</span>';
        list.appendChild(row);
      });
    } catch (e) { list.innerHTML = '<p class="error">' + esc(e.message) + '</p>'; }
  }

  // ── Events ──────────────────────────────────────────────────────────────
  function bind() {
    document.querySelectorAll('.side-link').forEach(function (b) {
      b.onclick = function () {
        if (busy) return;
        tab = b.dataset.tab;
        render();
        window.location.hash = '/manage/' + tab;
      };
    });
    $('modal-cancel').onclick = function () { $('modal').classList.add('hidden'); };
    $('btn-retry').onclick = function () {
      $('signin-error').classList.add('hidden');
      $('btn-retry').classList.add('hidden');
      show('screen-loading');
      boot();
    };
    $('modal-save').onclick = async function () {
      if (modalSave && !busy) {
        setBusy(true, $('modal-save'), 'Saving…');
        try { await modalSave(); } catch (e) { toast(e.message, true); }
        setBusy(false, $('modal-save'));
      }
    };
    $('btn-logout').onclick = async function () { await clerk.signOut(); window.location.href = '/'; };
    $('btn-denied-out').onclick = async function () { await clerk.signOut(); window.location.href = '/'; };
    $('btn-claim').onclick = async function () {
      try {
        var email = (clerk.user && (clerk.user.primaryEmailAddress || {}).emailAddress) || '';
        await api('/api/cms/bootstrap', { method: 'POST', body: { email: email } });
        toast('Owner access granted ✓');
        await enter();
      } catch (e) { $('denied-error').textContent = e.message; $('denied-error').classList.remove('hidden'); }
    };
    $('btn-preview').onclick = function () {
      try { sessionStorage.setItem('revolvyn_preview_token', token); } catch (e) {}
      var page = tab === 'portfolio' ? 'portfolio.html' : tab === 'brands' ? 'brands.html'
        : tab === 'services' ? 'services.html' : tab === 'contact' ? 'contact.html' : 'index.html';
      window.open(page + '?cms_preview=draft', '_blank');
    };
    $('btn-publish').onclick = async function () {
      var ok = await confirmDialog('Publish changes?', 'These changes will become visible on the live website.', 'Publish');
      if (!ok) return;
      setBusy(true, $('btn-publish'), 'Publishing…');
      try {
        await api('/api/cms/publish', { method: 'POST' });
        await reload(); render(); toast('Changes published successfully ✓');
      } catch (e) { toast(e.message, true); }
      setBusy(false, $('btn-publish'));
    };
    window.addEventListener('beforeunload', function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
    var h = (window.location.hash || '').replace('#/manage/', '');
    if (h && ['home', 'portfolio', 'brands', 'services', 'testimonials', 'contact', 'history', 'activity'].indexOf(h) >= 0) tab = h;
  }

  document.addEventListener('DOMContentLoaded', function () { bind(); boot(); });
})();
