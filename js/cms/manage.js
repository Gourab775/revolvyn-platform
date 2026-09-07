/* REVOLVYN Website Manager — professional client CMS.
   Content-first, zero jargon. Drawer editing, drag ordering, draft/publish. */
(function () {
  'use strict';
  var clerk = null, token = null, draft = null, me = null;
  var tab = 'home', dirty = false, busy = false, uploadsOn = false;
  var BUILD_TAG = 'cms-20260909-pro';
  var DEBUG = /(?:\?|&)cms-debug=1/.test(window.location.search);
  var ui = { search: '', filter: 'all', morePage: null };

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var DRAG_SVG = '<svg viewBox="0 0 16 20" fill="currentColor"><circle cx="5.5" cy="4" r="1.6"/><circle cx="10.5" cy="4" r="1.6"/><circle cx="5.5" cy="10" r="1.6"/><circle cx="10.5" cy="10" r="1.6"/><circle cx="5.5" cy="16" r="1.6"/><circle cx="10.5" cy="16" r="1.6"/></svg>';
  var FILM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/></svg>';
  var SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

  /* ── Feedback ─────────────────────────────────────────────────── */
  function toast(msg, isErr) {
    var t = el('div', 'toast' + (isErr ? ' err' : ''), msg);
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }
  function confirmDialog(title, text, okLabel, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      $('confirm-title').textContent = title;
      $('confirm-text').textContent = text;
      var ok = $('confirm-ok');
      ok.textContent = okLabel || 'Delete';
      ok.className = 'btn ' + (opts.okKind || 'danger');
      $('confirm-cancel').classList.toggle('hidden', !!opts.hideCancel);
      $('confirm').classList.remove('hidden');
      ok.onclick = function () { $('confirm').classList.add('hidden'); resolve(true); };
      $('confirm-cancel').onclick = function () { $('confirm').classList.add('hidden'); resolve(false); };
    });
  }

  /* ── API ──────────────────────────────────────────────────────── */
  async function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var res = await fetch(path, {
      method: opts.method || 'GET', headers: headers,
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
    if (btn) {
      btn.disabled = b;
      if (text) btn.dataset.orig = btn.dataset.orig || btn.textContent;
      btn.textContent = b ? text : (btn.dataset.orig || btn.textContent);
    }
  }

  /* ── Draft state / status ─────────────────────────────────────── */
  function unpublishedItems(d) {
    var out = [];
    ['sections', 'portfolio', 'brands', 'services', 'testimonials'].forEach(function (k) {
      (d[k] || []).forEach(function (x) { if (x.has_unpublished_changes) out.push(x); });
    });
    (d.settings || []).forEach(function (s) { if (s.has_unpublished_changes) out.push(s); });
    return out;
  }
  function markDirty() { dirty = true; renderPill(); }
  function renderPill() {
    var pill = $('status-pill');
    var n = dirty ? unpublishedItems(draft || {}).length : (draft ? unpublishedItems(draft).length : 0);
    if (n > 0) {
      pill.textContent = 'Unpublished changes' + (n > 1 ? ' (' + n + ')' : '');
      pill.className = 'pill dirty';
      pill.title = 'Your edits are saved as drafts. Press “Publish changes” to make them live.';
    } else {
      pill.textContent = 'All published';
      pill.className = 'pill clean';
      pill.title = 'Everything visitors see is up to date.';
    }
  }

  function signinFail(message, showRetry, tech) {
    $('signin-error').textContent = message;
    $('signin-error').classList.remove('hidden');
    $('btn-retry').classList.toggle('hidden', !showRetry);
    var t = $('signin-tech');
    if (tech) { t.textContent = tech; t.classList.remove('hidden'); }
    else t.classList.add('hidden');
    show('screen-signin');
  }
  function techLine(diag, raw) {
    var line = 'Tech details: site=' + window.location.hostname + ' | server=' + diag;
    if (DEBUG && raw) line += ' | reply=' + String(raw).slice(0, 200);
    console.error('[Website Manager]', line, raw || '');
    return line;
  }
  function show(id) {
    ['screen-loading', 'screen-signin', 'screen-denied', 'screen-cms'].forEach(function (s) {
      $(s).classList.toggle('hidden', s !== id);
    });
  }

  /* ── Boot / session ───────────────────────────────────────────── */
  async function boot() {
    var diag = 'not-checked', raw = '';
    try {
      var res = await fetch('/api/public/config', { cache: 'no-store' });
      raw = await res.text();
      try {
        var c = JSON.parse(raw);
        uploadsOn = !!c.uploadsEnabled;
        diag = c.manageEnabled ? 'ok' : 'keys-missing-on-server';
      } catch (e) { diag = 'blocked-login-wall(http-' + res.status + ')'; }
      if (diag.indexOf('blocked') !== 0 && !res.ok) diag = 'server-error(http-' + res.status + ')';
    } catch (e) { diag = 'network-fail'; }
    console.log('[Website Manager]', 'build ' + BUILD_TAG + ' | site=' + window.location.hostname + ' | server=' + diag);
    var bt = $('build-tag');
    if (bt) bt.textContent = BUILD_TAG + ' · ' + window.location.hostname;
    var attempts = 0;
    while (!window.Clerk && attempts < 100) { await new Promise(function (r) { setTimeout(r, 100); }); attempts++; }
    if (!window.Clerk) {
      signinFail('Could not load the sign-in box. Check your connection and try again.', true);
      return;
    }
    clerk = window.Clerk;
    try {
      await clerk.load(); // key comes from the script tag's data attribute
    } catch (e) {
      signinFail('Could not start sign-in (' + ((e && e.message) || 'unknown error') + '). Check your connection and try again.', true,
        techLine(diag, raw));
      return;
    }
    if (!clerk.user) {
      show('screen-signin');
      clerk.mountSignIn($('clerk-signin'), { fallbackRedirectUrl: '/manage', forceRedirectUrl: '/manage' });
      return;
    }
    await enter();
  }

  async function enter() {
    token = await clerk.session.getToken();
    setInterval(async function () { try { token = await clerk.session.getToken(); } catch (e) {} }, 50000);
    try {
      var r = await api('/api/cms/me');
      me = r.user || null;
      var chip = $('user-chip');
      if (me && me.email) {
        chip.title = me.email + ' (' + me.role + ')';
        $('user-avatar').textContent = me.email.charAt(0).toUpperCase();
      }
      toast('Welcome back' + (me && me.email ? ', ' + me.email : '') + ' ✓');
    } catch (e) {
      if (e.status === 403) { show('screen-denied'); return; }
      signinFail(e.message, true,
        techLine('api-unreachable' + (e.status ? '(http-' + e.status + ')' : ''), ''));
      return;
    }
    await reload(false);
    show('screen-cms');
    render();
  }

  async function reload(withSkel) {
    if (withSkel) skeletons($('tab-content'), 4);
    draft = await api('/api/cms/draft');
    dirty = false;
    renderPill();
  }
  function skeletons(parent, n) {
    parent.innerHTML = '';
    for (var i = 0; i < (n || 4); i++) {
      var s = el('div', 'skel');
      s.innerHTML = '<div class="skel-line" style="width:38%"></div><div class="skel-line" style="width:82%"></div><div class="skel-line" style="width:64%"></div>';
      parent.appendChild(s);
    }
  }

  /* ── Drawer editor ────────────────────────────────────────────── */
  var drawerSave = null, drawerInitial = '';
  function openDrawer(opts) {
    // opts: {title, sub, groups:[{title, note, fields:[{key,label,type,tip,placeholder,required,options}]}], values, extra(build fn), onSave, saveLabel}
    $('drawer-title').textContent = opts.title || 'Edit';
    $('drawer-sub').textContent = opts.sub || '';
    var body = $('drawer-body');
    body.innerHTML = '';
    (opts.groups || []).forEach(function (g) {
      var box = el('div', 'd-group');
      if (g.title) box.appendChild(el('h4', null, g.title));
      if (g.note) box.appendChild(el('div', 'd-note', g.note));
      (g.fields || []).forEach(function (f) { box.appendChild(buildField(f, opts.values || {})); });
      body.appendChild(box);
    });
    if (opts.extra) opts.extra(body, opts.values || {});
    $('drawer-save').textContent = opts.saveLabel || 'Save changes';
    drawerInitial = JSON.stringify(collectDrawer(false));
    drawerSave = opts.onSave;
    $('drawer').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function collectDrawer(validate) {
    var out = {};
    var firstBad = null;
    $('drawer-body').querySelectorAll('[data-key]').forEach(function (node) {
      var k = node.dataset.key;
      if (node.dataset.complex) {
        out[k] = node._get ? node._get() : null;
        return;
      }
      if (node.dataset.seg) {
        var act = node.querySelector('button.active');
        out[k] = act ? act.dataset.value : node.dataset.current;
        return;
      }
      out[k] = node.value;
      if (validate && node.dataset.required && !String(node.value || '').trim()) {
        node.style.borderColor = 'rgba(224,138,138,.7)';
        if (!firstBad) firstBad = node;
      } else if (node.style) {
        node.style.borderColor = '';
      }
    });
    return { values: out, bad: firstBad };
  }
  function drawerValues() { return collectDrawer(false).values; }
  async function requestCloseDrawer() {
    if (busy) return;
    var changed = JSON.stringify(collectDrawer(false)) !== drawerInitial;
    if (changed) {
      var ok = await confirmDialog('Discard unsaved changes?', 'Your edits in this panel will be lost.', 'Discard', { okKind: 'primary' });
      if (!ok) return;
    }
    closeDrawer();
  }
  function closeDrawer() {
    $('drawer').classList.add('hidden');
    document.body.style.overflow = '';
    drawerSave = null;
  }

  function buildField(f, values) {
    var div = el('div', 'field');
    var lab = el('label', null, f.label || f.key);
    lab.htmlFor = 'df-' + f.key;
    div.appendChild(lab);
    var val = values[f.key] == null ? '' : values[f.key];
    var input = null;
    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.value = typeof val === 'string' ? val : '';
    } else if (f.type === 'image' || f.type === 'video') {
      div.appendChild(mediaBox(f.key, typeof val === 'string' ? val : '', f.type, f.tip));
      return div;
    } else if (f.type === 'seg') {
      div.appendChild(segControl(f.key, val, f.options || []));
      return div;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = typeof val === 'string' ? val : String(val == null ? '' : val);
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.inputmode) input.inputMode = f.inputmode;
    }
    input.id = 'df-' + f.key;
    input.dataset.key = f.key;
    if (f.required) input.dataset.required = '1';
    div.appendChild(input);
    if (f.tip && f.type !== 'image' && f.type !== 'video') div.appendChild(el('div', 'hint', f.tip));
    return div;
  }

  function segControl(key, val, options) {
    var box = el('div', 'seg');
    box.dataset.key = key;
    box.dataset.seg = '1';
    box.dataset.current = val || (options[0] && options[0].value) || '';
    options.forEach(function (o) {
      var b = el('button', (box.dataset.current === o.value ? 'active' : ''), o.label);
      b.type = 'button';
      b.dataset.value = o.value;
      b.onclick = function () {
        box.dataset.current = o.value;
        box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
      };
      box.appendChild(b);
    });
    return box;
  }

  /* Media: preview + replace (upload w/ progress) + remove + link paste */
  function mediaBox(key, val, kind, tip) {
    var box = el('div', 'media-box');
    function render(v) {
      box.innerHTML = '';
      if (v) {
        var prev = kind === 'video' ? document.createElement('video') : document.createElement('img');
        prev.src = v;
        prev.className = 'thumb' + (kind === 'image' && /logo/i.test(key) ? ' logo' : '');
        if (kind === 'video') { prev.controls = true; prev.muted = true; prev.preload = 'metadata'; }
        prev.alt = '';
        box.appendChild(prev);
      }
      var hidden = document.createElement('input');
      hidden.type = 'hidden'; hidden.dataset.key = key; hidden.value = v || '';
      box.appendChild(hidden);
      var row = el('div', 'row-actions');
      var rep = el('button', 'btn small ghost', v ? (kind === 'video' ? 'Change video' : 'Replace image') : (kind === 'video' ? 'Add video' : 'Add image'));
      rep.type = 'button';
      rep.onclick = function () { replaceMedia(box, key, kind, render); };
      row.appendChild(rep);
      if (v) {
        var rm = el('button', 'btn small ghost', 'Remove');
        rm.type = 'button';
        rm.onclick = function () { render(''); };
        row.appendChild(rm);
      }
      box.appendChild(row);
      var h = el('div', 'hint', tip || (uploadsOn
        ? 'Choose a file to upload, or paste a link below.'
        : 'Paste an image link below — or ask your developer to enable file uploads.'));
      box.appendChild(h);
      var link = document.createElement('input');
      link.type = 'text'; link.placeholder = 'Paste link here…'; link.value = v || '';
      link.style.cssText = 'width:100%;margin-top:8px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:13px;font-family:inherit;';
      link.onchange = function () { render(link.value.trim()); };
      box.appendChild(link);
    }
    render(val);
    return box;
  }

  function replaceMedia(box, key, kind, done) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'video' ? 'video/*' : 'image/*';
    input.onchange = async function () {
      var file = input.files[0];
      if (!file) return;
      if (file.size > 100 * 1024 * 1024) { toast('That file is too large (max 100 MB).', true); return; }
      if (!uploadsOn) {
        toast('Uploads are off — paste a link instead.', true);
        return;
      }
      var bar = el('div', 'media-progress');
      bar.innerHTML = '<div></div>';
      box.appendChild(bar);
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
        bar.remove();
        if (!up.ok) throw new Error('Upload failed. Please try again.');
        toast('Uploaded ✓');
        done(jd.secure_url);
      } catch (e) { bar.remove(); toast(e.message, true); }
    };
    input.click();
  }

  /* Complex editors (packages / blocks / links / stats / steps / lines) */
  function complexHost(key, get) {
    var host = el('div');
    host.dataset.key = key;
    host.dataset.complex = '1';
    host._get = get;
    return host;
  }

  // Service "what's included": packages with bullet items.
  function packagesEditor(host, packages) {
    packages = Array.isArray(packages) ? packages : [];
    function render() {
      host.innerHTML = '';
      packages.forEach(function (pkg, pi) {
        var card = el('div', 'pkg');
        var head = el('div', 'pkg-head');
        var name = document.createElement('input');
        name.type = 'text'; name.placeholder = 'Package name (e.g. Growth Website)';
        name.value = pkg.package || '';
        name.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-family:inherit;';
        name.oninput = function () { pkg.package = name.value; };
        var del = el('button', 'mini-btn', '×');
        del.type = 'button'; del.title = 'Remove package';
        del.onclick = function () { packages.splice(pi, 1); render(); };
        head.appendChild(name); head.appendChild(del);
        card.appendChild(head);
        (pkg.items || []).forEach(function (item, ii) {
          var row = el('div', 'pkg-row');
          var inp = document.createElement('input');
          inp.type = 'text'; inp.value = item; inp.placeholder = 'One included item per line';
          inp.style.cssText = name.style.cssText;
          inp.oninput = function () { pkg.items[ii] = inp.value; };
          var x = el('button', 'mini-btn', '×');
          x.type = 'button'; x.title = 'Remove line';
          x.onclick = function () { pkg.items.splice(ii, 1); render(); };
          row.appendChild(inp); row.appendChild(x);
          card.appendChild(row);
        });
        var addLine = el('button', 'btn small ghost add-row-btn', '+ Add line');
        addLine.type = 'button';
        addLine.onclick = function () { pkg.items = pkg.items || []; pkg.items.push(''); render(); };
        card.appendChild(addLine);
        if (pkg.note !== undefined) {
          var note = document.createElement('input');
          note.type = 'text'; note.value = pkg.note || ''; note.placeholder = 'Small note (optional)';
          note.style.cssText = name.style.cssText + 'margin-top:8px;';
          note.oninput = function () { pkg.note = note.value; };
          card.appendChild(note);
        }
        host.appendChild(card);
      });
      var add = el('button', 'btn small ghost', '+ Add package');
      add.type = 'button';
      add.onclick = function () { packages.push({ package: '', items: [''] }); render(); };
      host.appendChild(add);
    }
    render();
  }

  // Secondary-page content blocks: heading + paragraphs.
  function blocksEditor(host, blocks) {
    blocks = Array.isArray(blocks) ? blocks : [];
    function render() {
      host.innerHTML = '';
      blocks.forEach(function (b, bi) {
        var card = el('div', 'pkg');
        var head = el('div', 'pkg-head');
        var name = document.createElement('input');
        name.type = 'text'; name.placeholder = 'Heading';
        name.value = b.heading || '';
        name.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-weight:600;font-family:inherit;';
        name.oninput = function () { b.heading = name.value; };
        head.appendChild(name);
        card.appendChild(head);
        (b.texts || []).forEach(function (t, ti) {
          var row = el('div', 'para-row');
          var ta = document.createElement('textarea');
          ta.value = t; ta.placeholder = 'Paragraph text…';
          ta.style.cssText = 'flex:1;min-height:76px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:13.5px;font-family:inherit;line-height:1.6;resize:vertical;';
          ta.oninput = function () { b.texts[ti] = ta.value; };
          var x = el('button', 'mini-btn', '×');
          x.type = 'button'; x.title = 'Remove paragraph';
          x.onclick = function () { b.texts.splice(ti, 1); render(); };
          row.appendChild(ta); row.appendChild(x);
          card.appendChild(row);
        });
        var addP = el('button', 'btn small ghost add-row-btn', '+ Add paragraph');
        addP.type = 'button';
        addP.onclick = function () { b.texts = b.texts || []; b.texts.push(''); render(); };
        card.appendChild(addP);
        host.appendChild(card);
      });
      var tip = el('div', 'hint', 'Tip: write links like this — [Contact page](contact.html)');
      host.appendChild(tip);
    }
    render();
  }

  // Footer link columns: fixed groups of label + address rows.
  function footerLinksEditor(host, cols) {
    cols = cols || {};
    var groups = [['explore', 'Explore'], ['resources', 'Resources'], ['connect', 'Connect']];
    groups.forEach(function (g) {
      var key = g[0];
      var box = el('div', 'd-group');
      box.appendChild(el('h4', null, g[1]));
      (cols[key] || []).forEach(function (link) {
        var row = el('div', 'link-row');
        var l = document.createElement('input');
        l.type = 'text'; l.value = link.label || ''; l.placeholder = 'Label';
        l.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-family:inherit;';
        l.oninput = function () { link.label = l.value; };
        var u = document.createElement('input');
        u.type = 'text'; u.value = link.url || ''; u.placeholder = 'Address';
        u.style.cssText = l.style.cssText;
        u.oninput = function () { link.url = u.value; };
        row.appendChild(l); row.appendChild(u);
        box.appendChild(row);
      });
      host.appendChild(box);
    });
  }

  // Stats rows: number + label.
  function statsEditor(host, items) {
    items = Array.isArray(items) ? items : [];
    function render() {
      host.innerHTML = '';
      items.forEach(function (st, i) {
        var row = el('div', 'link-row');
        var n = document.createElement('input');
        n.type = 'text'; n.value = st.number || ''; n.placeholder = 'Number (e.g. 320+)';
        var l = document.createElement('input');
        l.type = 'text'; l.value = st.label || ''; l.placeholder = 'Label (e.g. Brands Served)';
        [n, l].forEach(function (inp) {
          inp.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-family:inherit;';
        });
        n.oninput = function () { st.number = n.value; };
        l.oninput = function () { st.label = l.value; };
        var x = el('button', 'mini-btn', '×');
        x.type = 'button'; x.title = 'Remove';
        x.onclick = function () { items.splice(i, 1); render(); };
        row.appendChild(n); row.appendChild(l); row.appendChild(x);
        host.appendChild(row);
      });
      var add = el('button', 'btn small ghost', '+ Add number');
      add.type = 'button';
      add.onclick = function () { items.push({ number: '', label: '' }); render(); };
      host.appendChild(add);
    }
    render();
  }

  // Process steps: title + text rows.
  function stepsEditor(host, steps) {
    steps = Array.isArray(steps) ? steps : [];
    function render() {
      host.innerHTML = '';
      steps.forEach(function (st, i) {
        var card = el('div', 'pkg');
        var head = el('div', 'pkg-head');
        var num = el('span', 'order-num', 'Step ' + (i + 1));
        var t = document.createElement('input');
        t.type = 'text'; t.value = st.title || ''; t.placeholder = 'Step name';
        t.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-weight:600;font-family:inherit;';
        t.oninput = function () { st.title = t.value; };
        var x = el('button', 'mini-btn', '×');
        x.type = 'button'; x.title = 'Remove step';
        x.onclick = function () { steps.splice(i, 1); render(); };
        head.appendChild(num); head.appendChild(t); head.appendChild(x);
        card.appendChild(head);
        var ta = document.createElement('textarea');
        ta.value = st.text || ''; ta.placeholder = 'What happens in this step…';
        ta.style.cssText = 'width:100%;min-height:64px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:13.5px;font-family:inherit;resize:vertical;';
        ta.oninput = function () { st.text = ta.value; };
        card.appendChild(ta);
        host.appendChild(card);
      });
      var add = el('button', 'btn small ghost', '+ Add step');
      add.type = 'button';
      add.onclick = function () { steps.push({ title: '', text: '' }); render(); };
      host.appendChild(add);
    }
    render();
  }

  /* ── Sections (page content rows) ───────────────────────────────── */
  function findSec(page, key) {
    return (draft.sections || []).filter(function (s) { return s.page_slug === page && s.section_key === key; })[0] || null;
  }
  function previewSnippet(data) {
    if (!data) return '';
    if (Array.isArray(data.blocks)) {
      return data.blocks.map(function (b) { return b.heading; }).filter(Boolean).join(' · ').slice(0, 140);
    }
    if (Array.isArray(data.items)) {
      return data.items.map(function (i) { return i.number || i.label || i.title; }).filter(Boolean).join(' · ').slice(0, 140);
    }
    if (Array.isArray(data.steps)) {
      return data.steps.map(function (s) { return s.title; }).filter(Boolean).join(' → ').slice(0, 140);
    }
    var picks = ['heading', 'title', 'titleA', 'description', 'subtitle', 'quote', 'tag', 'text', 'buttonText', 'linkText'];
    for (var i = 0; i < picks.length; i++) {
      if (data[picks[i]]) return String(data[picks[i]]).slice(0, 140);
    }
    return '';
  }
  function sectionRow(parent, page, key, def) {
    var s = findSec(page, key);
    if (!s) return;
    var card = el('div', 'sec-card' + (s.is_visible ? '' : ' is-hidden'));
    var info = el('div', 'sec-info');
    var titleRow = el('div', 'sec-title', def.title);
    if (s.has_unpublished_changes) {
      var dot = el('span', 'dot-unpub');
      dot.title = 'Has unpublished changes';
      titleRow.appendChild(dot);
    }
    if (!s.is_visible) titleRow.appendChild(el('span', 'tag-hidden', 'Hidden'));
    info.appendChild(titleRow);
    if (def.desc) info.appendChild(el('div', 'sec-desc', def.desc));
    var snip = previewSnippet(s.data);
    if (snip) info.appendChild(el('div', 'sec-preview', '“' + snip + '”'));
    card.appendChild(info);
    var acts = el('div', 'sec-actions');
    acts.appendChild(visSwitch(s.is_visible, function (on) {
      saveSections([{ id: s.id, data: s.data, is_visible: on }]);
    }));
    var edit = el('button', 'btn small primary', 'Edit');
    edit.onclick = function () {
      openDrawer({
        title: 'Edit — ' + def.title, sub: def.desc || '',
        groups: def.groups, values: Object.assign({}, s.data),
        extra: def.extra,
        onSave: async function (out) { await saveSections([{ id: s.id, data: out }]); }
      });
    };
    acts.appendChild(edit);
    card.appendChild(acts);
    parent.appendChild(card);
  }
  function visSwitch(on, onChange) {
    var lab = el('label', 'switch');
    var inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = !!on;
    inp.onchange = function () { onChange(inp.checked); };
    lab.appendChild(inp);
    lab.appendChild(el('span', 'track'));
    lab.appendChild(el('span', 'switch-label', on ? 'Shown' : 'Hidden'));
    lab.title = 'Show on website';
    return lab;
  }
  async function saveSections(sections) {
    try {
      var r = await api('/api/cms/sections', { method: 'PATCH', body: { sections: sections } });
      (r.sections || []).forEach(function (ns) {
        var i = draft.sections.findIndex(function (x) { return x.id === ns.id; });
        if (i >= 0) draft.sections[i] = Object.assign({}, draft.sections[i], ns);
      });
      markDirty(); render(); toast('Saved ✓ — not live until you Publish');
    } catch (e) { toast(e.message, true); throw e; }
  }

  /* ── Page head helper ───────────────────────────────────────────── */
  function pageHead(parent, title, sub, actions) {
    var head = el('div', 'page-head');
    var row = el('div', 'row');
    var left = el('div');
    left.appendChild(el('h2', null, title));
    if (sub) left.appendChild(el('p', 'muted', sub));
    row.appendChild(left);
    if (actions) {
      var ar = el('div', 'row-actions');
      actions.forEach(function (a) { ar.appendChild(a); });
      row.appendChild(ar);
    }
    head.appendChild(row);
    parent.appendChild(head);
  }
  function refreshBtn() {
    var b = el('button', 'btn small ghost', 'Refresh');
    b.onclick = async function () {
      setBusy(true, b, 'Loading…');
      try { await reload(true); render(); } catch (e) { toast(e.message, true); }
      setBusy(false, b);
    };
    return b;
  }

  /* ── Collections ────────────────────────────────────────────────── */
  var COLS = {
    portfolio: {
      plural: 'Portfolio', single: 'Project', addLabel: '+ Add project',
      intro: 'Videos and case work shown on the Portfolio page and homepage strip. Changes stay drafts until you Publish.',
      searchKeys: ['title', 'client_name', 'category'],
      thumbOf: function (it) { return it.thumbnail || ''; },
      isVideo: function () { return true; },
      titleOf: function (it) { return it.title || 'Untitled project'; },
      metaOf: function (it) { return [it.client_name, it.category, it.layout === 'portrait' ? 'Portrait' : 'Landscape'].filter(Boolean).join('  ·  '); },
      descOf: function (it) { return it.description || ''; },
      groups: function () {
        return [
          { title: 'Content', fields: [
            { key: 'title', label: 'Project title', required: true, placeholder: 'e.g. Nike Air' },
            { key: 'client_name', label: 'Client / brand' },
            { key: 'category', label: 'Category', placeholder: 'e.g. Sportswear' },
            { key: 'description', label: 'Short description', type: 'textarea' }
          ]},
          { title: 'Media', fields: [
            { key: 'video_url', label: 'Video', type: 'video' },
            { key: 'thumbnail', label: 'Thumbnail photo (optional)', type: 'image' },
            { key: 'layout', label: 'Shape on the page', type: 'seg', options: [{ value: 'landscape', label: 'Wide' }, { value: 'portrait', label: 'Tall' }] }
          ]},
          { title: 'Links', fields: [
            { key: 'external_url', label: 'Project link (optional)', type: 'text', tip: 'Opens when a visitor clicks this project. Leave empty for the built-in video page.' }
          ]}
        ];
      }
    },
    brands: {
      plural: 'Brands', single: 'Brand', addLabel: '+ Add brand',
      intro: 'Logos shown on the Brands page and homepage strip.',
      searchKeys: ['name'],
      thumbOf: function (it) { return it.logo || ''; },
      logo: true,
      titleOf: function (it) { return it.name || 'Unnamed brand'; },
      metaOf: function (it) { return it.website_url || ''; },
      descOf: function () { return ''; },
      groups: function () {
        return [{ title: 'Content', fields: [
          { key: 'name', label: 'Brand name', required: true },
          { key: 'logo', label: 'Logo', type: 'image' },
          { key: 'website_url', label: 'Website link (optional)', type: 'text' }
        ]}];
      }
    },
    services: {
      plural: 'Services', single: 'Service', addLabel: '+ Add service',
      intro: 'Full service entries on the Services page, each with its package list.',
      searchKeys: ['title', 'description'],
      thumbOf: function (it) { return it.image || ''; },
      titleOf: function (it) { return it.title || 'Untitled service'; },
      metaOf: function (it) {
        var n = Array.isArray(it.details) ? it.details.length : 0;
        return n ? n + (n === 1 ? ' package' : ' packages') : '';
      },
      descOf: function (it) { return it.description || ''; },
      groups: function () {
        return [
          { title: 'Content', fields: [
            { key: 'title', label: 'Service name', required: true },
            { key: 'description', label: 'Short description', type: 'textarea' },
            { key: 'icon', label: 'Icon (optional)', tip: 'A single symbol, e.g. ✦' }
          ]},
          { title: 'Media', fields: [{ key: 'image', label: 'Image (optional)', type: 'image' }] }
        ];
      },
      extra: function (body, values) {
        var g = el('div', 'd-group');
        g.appendChild(el('h4', null, "What's included"));
        g.appendChild(el('div', 'd-note', 'Packages and bullet lines exactly as visitors see them.'));
        var host = complexHost('details', function () {
          return (values.details || []).map(function (p) {
            return {
              package: p.package || '',
              items: (p.items || []).filter(function (x) { return String(x || '').trim() !== ''; }),
              note: p.note || undefined
            };
          }).filter(function (p) { return p.package || p.items.length; });
        });
        if (!Array.isArray(values.details)) values.details = [];
        packagesEditor(host, values.details);
        g.appendChild(host);
        body.appendChild(g);
      }
    },
    testimonials: {
      plural: 'Testimonials', single: 'Testimonial', addLabel: '+ Add testimonial',
      intro: 'Client words, saved and ready. They will appear publicly once the testimonials section launches on the website.',
      searchKeys: ['name', 'company', 'content'],
      thumbOf: function (it) { return it.photo || ''; },
      titleOf: function (it) { return it.name || 'Unnamed'; },
      metaOf: function (it) { return [it.role, it.company].filter(Boolean).join(' · '); },
      descOf: function (it) { return it.content || ''; },
      groups: function () {
        return [
          { title: 'Content', fields: [
            { key: 'content', label: 'What they said', type: 'textarea', required: true },
            { key: 'name', label: 'Person name', required: true },
            { key: 'company', label: 'Company / brand' },
            { key: 'role', label: 'Role' }
          ]},
          { title: 'Media', fields: [{ key: 'photo', label: 'Photo (optional)', type: 'image' }] }
        ];
      }
    }
  };

  function sortedItems(resource) {
    return (draft[resource] || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
  }
  function matchesFilter(it, def, q, filter) {
    if (filter === 'visible' && !it.is_visible) return false;
    if (filter === 'hidden' && it.is_visible) return false;
    if (q) {
      var hay = def.searchKeys.map(function (k) { return String(it[k] || ''); }).join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  function renderCollection(c, resource) {
    var def = COLS[resource];
    var items = sortedItems(resource);
    pageHead(c, def.plural, def.intro, [refreshBtn(), addBtn(resource, def)]);
    // toolbar
    var bar = el('div', 'toolbar');
    var sWrap = el('div', 'search');
    sWrap.innerHTML = SEARCH_SVG;
    var sInp = document.createElement('input');
    sInp.type = 'text'; sInp.placeholder = 'Search ' + def.plural.toLowerCase() + '…';
    sInp.value = ui.search;
    sInp.oninput = function () { ui.search = sInp.value.toLowerCase(); render(); keepFocus(sInp); };
    sWrap.appendChild(sInp);
    bar.appendChild(sWrap);
    var chips = el('div', 'chips');
    [['all', 'All'], ['visible', 'Visible'], ['hidden', 'Hidden']].forEach(function (ch) {
      var b = el('button', 'chip' + (ui.filter === ch[0] ? ' active' : ''), ch[1] + (ch[0] === 'all' ? ' (' + items.length + ')' : ''));
      b.onclick = function () { ui.filter = ch[0]; render(); };
      chips.appendChild(b);
    });
    bar.appendChild(chips);
    c.appendChild(bar);
    var tip = el('p', 'muted', 'Drag the handle to reorder. Hidden items stay saved but visitors can’t see them.');
    tip.style.fontSize = '12.5px';
    c.appendChild(tip);

    var shown = items.filter(function (it) { return matchesFilter(it, def, ui.search, ui.filter); });
    if (!items.length) {
      c.appendChild(emptyState(
        'No ' + def.plural.toLowerCase() + ' yet.',
        'Add your first ' + def.single.toLowerCase() + ' to display it on the website.',
        def.addLabel, function () { openItemDrawer(resource, null); }
      ));
      return;
    }
    if (!shown.length) {
      c.appendChild(emptyState('Nothing matches.', 'Try a different search or filter.', null, null));
      return;
    }
    var grid = el('div', 'cards');
    shown.forEach(function (it, idx) {
      grid.appendChild(itemCard(resource, def, it, items.indexOf(it)));
    });
    c.appendChild(grid);
  }
  function keepFocus(input) {
    var v = input.value;
    input.focus();
    try { input.setSelectionRange(v.length, v.length); } catch (e) {}
  }
  function addBtn(resource, def) {
    var b = el('button', 'btn primary', def.addLabel);
    b.onclick = function () { openItemDrawer(resource, null); };
    return b;
  }
  function emptyState(title, sub, actionLabel, actionFn) {
    var d = el('div', 'empty');
    d.appendChild(el('p', 'empty-title', title));
    if (sub) d.appendChild(el('p', null, sub));
    if (actionLabel) {
      var b = el('button', 'btn primary', actionLabel);
      b.onclick = actionFn;
      d.appendChild(b);
    }
    return d;
  }

  function itemCard(resource, def, it, orderIdx) {
    var card = el('div', 'item-card' + (it.is_visible ? '' : ' is-hidden'));
    card.dataset.id = it.id;
    var handle = el('span', 'drag-handle');
    handle.innerHTML = DRAG_SVG;
    handle.title = 'Drag to reorder';
    card.appendChild(handle);
    var media = def.thumbOf(it);
    if (media) {
      var im = document.createElement('img');
      im.src = media; im.alt = ''; im.loading = 'lazy';
      im.className = 'item-media' + (def.logo ? ' logo' : '');
      card.appendChild(im);
    } else if (def.isVideo) {
      var ph = el('div', 'item-media');
      ph.innerHTML = FILM_SVG;
      ph.style.display = 'flex'; ph.style.alignItems = 'center'; ph.style.justifyContent = 'center';
      ph.style.color = 'var(--faint)';
      ph.firstChild.style.width = '30px'; ph.firstChild.style.height = '30px';
      card.appendChild(ph);
    }
    var body = el('div', 'item-body');
    body.appendChild(el('div', 'item-title', def.titleOf(it)));
    var meta = def.metaOf(it);
    if (meta) body.appendChild(el('div', 'item-meta', meta));
    var desc = def.descOf(it);
    if (desc) body.appendChild(el('div', 'item-desc', String(desc).slice(0, 140)));
    var flags = el('div', 'item-flags');
    flags.appendChild(el('span', 'order-num', '#' + (orderIdx + 1)));
    if (!it.is_visible) flags.appendChild(el('span', 'badge off', 'Hidden'));
    else flags.appendChild(el('span', 'badge', 'Visible'));
    if (it.has_unpublished_changes) {
      var d = el('span', 'dot-unpub'); d.title = 'Unpublished changes'; flags.appendChild(d);
    }
    body.appendChild(flags);
    var vis = visSwitch(it.is_visible, function (on) { toggleVis(resource, it, on); });
    vis.querySelector('.switch-label').textContent = 'Show on website';
    body.appendChild(vis);
    var acts = el('div', 'item-actions');
    var ed = el('button', 'btn small primary', 'Edit');
    ed.onclick = function () { openItemDrawer(resource, it); };
    var up = el('button', 'btn small ghost', '↑');
    up.title = 'Move up'; up.onclick = function () { moveItem(resource, it, -1); };
    var dn = el('button', 'btn small ghost', '↓');
    dn.title = 'Move down'; dn.onclick = function () { moveItem(resource, it, 1); };
    var del = el('button', 'btn small ghost', 'Delete');
    del.onclick = async function () { await deleteItem(resource, def, it); };
    [ed, up, dn, del].forEach(function (b) { acts.appendChild(b); });
    body.appendChild(acts);
    card.appendChild(body);

    // Drag & drop
    handle.addEventListener('mousedown', function () { card.draggable = true; });
    handle.addEventListener('mouseup', function () { card.draggable = false; });
    card.addEventListener('dragstart', function (e) {
      card.draggable = true;
      e.dataTransfer.setData('text/plain', it.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { card.classList.add('dragging'); }, 0);
    });
    card.addEventListener('dragend', function () {
      card.draggable = false;
      card.classList.remove('dragging');
      document.querySelectorAll('.item-card.drag-over').forEach(function (x) { x.classList.remove('drag-over'); });
    });
    card.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', function () { card.classList.remove('drag-over'); });
    card.addEventListener('drop', function (e) {
      e.preventDefault();
      card.classList.remove('drag-over');
      var draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== it.id) dropReorder(resource, draggedId, it.id);
    });
    return card;
  }

  function openItemDrawer(resource, it) {
    var def = COLS[resource];
    var isNew = !it;
    openDrawer({
      title: isNew ? 'Add ' + def.single.toLowerCase() : 'Edit — ' + def.titleOf(it),
      sub: isNew ? 'It will stay a draft until you Publish.' : '',
      groups: def.groups(),
      values: it ? Object.assign({}, it) : (resource === 'portfolio' ? { layout: 'landscape' } : {}),
      extra: def.extra,
      saveLabel: isNew ? 'Add' : 'Save changes',
      onSave: async function (out) {
        if (isNew) {
          var r = await api('/api/cms/' + resource, { method: 'POST', body: out });
          draft[resource].push(r.item);
          markDirty(); render(); toast('Added ✓ — not live until you Publish');
        } else {
          out.id = it.id;
          var r2 = await api('/api/cms/' + resource, { method: 'PATCH', body: out });
          Object.assign(it, r2.item);
          markDirty(); render(); toast('Saved ✓ — not live until you Publish');
        }
      }
    });
  }
  async function deleteItem(resource, def, it) {
    var ok = await confirmDialog('Delete this ' + def.single.toLowerCase() + '?',
      '“' + def.titleOf(it) + '” will be removed. This cannot be undone.', 'Delete');
    if (!ok) return;
    try {
      await api('/api/cms/' + resource + '?id=' + it.id, { method: 'DELETE' });
      draft[resource] = draft[resource].filter(function (x) { return x.id !== it.id; });
      markDirty(); render(); toast('Deleted ✓ — not live until you Publish');
    } catch (e) { toast(e.message, true); }
  }
  async function moveItem(resource, it, dir) {
    var items = sortedItems(resource);
    var i = items.findIndex(function (x) { return x.id === it.id; });
    var j = i + dir;
    if (j < 0 || j >= items.length) return;
    var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    await saveOrder(resource, items);
  }
  async function dropReorder(resource, draggedId, targetId) {
    var items = sortedItems(resource);
    var from = items.findIndex(function (x) { return x.id === draggedId; });
    var to = items.findIndex(function (x) { return x.id === targetId; });
    if (from < 0 || to < 0 || from === to) return;
    var moved = items.splice(from, 1)[0];
    items.splice(to, 0, moved);
    await saveOrder(resource, items);
  }
  async function saveOrder(resource, items) {
    try {
      await api('/api/cms/' + resource + '?action=reorder', { method: 'PATCH', body: { order: items.map(function (x) { return x.id; }) } });
      items.forEach(function (x, k) {
        x.sort_order = k;
        var o = draft[resource].filter(function (y) { return y.id === x.id; })[0];
        if (o) o.sort_order = k;
      });
      markDirty(); render(); toast('Order saved ✓ — not live until you Publish');
    } catch (e) { toast(e.message, true); }
  }
  async function toggleVis(resource, it, on) {
    try {
      var r = await api('/api/cms/' + resource, { method: 'PATCH', body: { id: it.id, is_visible: on } });
      Object.assign(it, r.item);
      markDirty(); render(); toast(on ? 'Will show on website after Publish ✓' : 'Hidden ✓ — takes effect on Publish');
    } catch (e) { toast(e.message, true); render(); }
  }

  /* ── Tab dispatch ─────────────────────────────────────────────── */
  function render() {
    document.querySelectorAll('.side-link').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    var counts = { portfolio: 0, brands: 0, services: 0, testimonials: 0 };
    Object.keys(counts).forEach(function (k) { counts[k] = (draft[k] || []).length; });
    document.querySelectorAll('[data-count]').forEach(function (n) {
      n.textContent = counts[n.dataset.count] || '';
      n.classList.toggle('hidden', !counts[n.dataset.count]);
    });
    var c = $('tab-content');
    c.innerHTML = '';
    if (!draft) { c.innerHTML = '<p class="muted">Loading…</p>'; return; }
    $('sidebar').classList.remove('open');
    if (tab === 'home') renderHome(c);
    else if (tab === 'portfolio') renderPortfolio(c);
    else if (tab === 'brands') renderBrands(c);
    else if (tab === 'services') renderServices(c);
    else if (tab === 'testimonials') renderCollection(c, 'testimonials');
    else if (tab === 'contact') renderContact(c);
    else if (tab === 'footer') renderFooter(c);
    else if (tab === 'more') renderMore(c);
    else if (tab === 'history') renderHistory(c);
    else if (tab === 'activity') renderActivity(c);
    renderPill();
  }

  var HOME_DEFS = [
    { page: 'home', key: 'hero', title: 'Hero', desc: 'Main introduction at the top of the homepage.',
      groups: [{ title: 'Content', fields: [
        { key: 'tag', label: 'Top label' },
        { key: 'heading', label: 'Main heading' },
        { key: 'description', label: 'Description', type: 'textarea' } ]}]},
    { page: 'home', key: 'manifesto', title: 'Intro statement', desc: 'The “who we are” statement below the hero.',
      groups: [{ title: 'Content', fields: [
        { key: 'label', label: 'Small label' },
        { key: 'heading', label: 'Statement', type: 'textarea' } ]}]},
    { page: 'home', key: 'portfolio_preview', title: 'Portfolio preview', desc: 'Work strip on the homepage. The videos themselves come from the Portfolio tab.',
      groups: [{ title: 'Content', fields: [
        { key: 'label', label: 'Section heading' },
        { key: 'linkText', label: 'Link text' },
        { key: 'linkUrl', label: 'Link address', type: 'text' } ]}]},
    { page: 'home', key: 'brands_preview', title: 'Brands preview', desc: 'Logo strip on the homepage. The logos come from the Brands tab.',
      groups: [{ title: 'Content', fields: [
        { key: 'label', label: 'Section heading' },
        { key: 'linkText', label: 'Link text' },
        { key: 'linkUrl', label: 'Link address', type: 'text' } ]}]},
    { page: 'home', key: 'quote', title: 'Quote', desc: 'Founder quote in the middle of the homepage.',
      groups: [{ title: 'Content', fields: [
        { key: 'quote', label: 'Quote', type: 'textarea' },
        { key: 'attribution', label: 'Who said it' } ]}]},
    { page: 'home', key: 'cta', title: 'Contact banner', desc: 'Closing banner that sends visitors to the contact page.',
      groups: [{ title: 'Content', fields: [
        { key: 'heading', label: 'Heading' } ]},
        { title: 'Links', fields: [
        { key: 'buttonText', label: 'Button text' },
        { key: 'buttonUrl', label: 'Button link', type: 'text' } ]}]}
  ];
  function renderHome(c) {
    pageHead(c, 'Home', 'Every text block on the homepage. Nothing goes live until you Publish.', [refreshBtn()]);
    HOME_DEFS.forEach(function (d) { sectionRow(c, d.page, d.key, d); });
  }

  function renderPortfolio(c) {
    pageHead(c, 'Portfolio', 'Projects, page heading and the bottom button.', [refreshBtn()]);
    sectionRow(c, 'portfolio', 'hero', { title: 'Page heading', desc: 'Title at the top of the Portfolio page.',
      groups: [{ title: 'Content', fields: [
        { key: 'titleA', label: 'First words' }, { key: 'titleAccent', label: 'Accent word (italic)' },
        { key: 'subtitle', label: 'Subtitle' } ]}]});
    sectionRow(c, 'portfolio', 'cta', { title: 'Bottom button', desc: 'Button under the project grid.',
      groups: [{ title: 'Content', fields: [
        { key: 'linkText', label: 'Button text' }, { key: 'linkUrl', label: 'Button link', type: 'text' } ]}]});
    renderCollection(c, 'portfolio');
  }

  function renderBrands(c) {
    pageHead(c, 'Brands', 'Logos, numbers, headings and the bottom button.', [refreshBtn()]);
    sectionRow(c, 'brands', 'hero', { title: 'Page heading', desc: 'Title at the top of the Brands page.',
      groups: [{ title: 'Content', fields: [
        { key: 'title', label: 'Heading' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' } ]}]});
    sectionRow(c, 'brands', 'stats', { title: 'Numbers', desc: 'The three statistics under the heading.',
      groups: [],
      extra: function (body, values) {
        var g = el('div', 'd-group');
        g.appendChild(el('h4', null, 'Numbers'));
        var host = complexHost('items', function () {
          return (values.items || []).map(function (s) {
            return { number: s.number || '', label: s.label || '' };
          }).filter(function (s) { return s.number || s.label; });
        });
        if (!Array.isArray(values.items)) values.items = [];
        statsEditor(host, values.items);
        g.appendChild(host);
        body.appendChild(g);
      }});
    sectionRow(c, 'brands', 'cta', { title: 'Bottom banner', desc: 'Banner under the logo grid.',
      groups: [{ title: 'Content', fields: [
        { key: 'heading', label: 'Heading' } ]},
        { title: 'Links', fields: [
        { key: 'buttonText', label: 'Button text' }, { key: 'buttonUrl', label: 'Button link', type: 'text' } ]}]});
    renderCollection(c, 'brands');
  }

  function renderServices(c) {
    pageHead(c, 'Services', 'Service entries, process steps and page texts.', [refreshBtn()]);
    sectionRow(c, 'services', 'hero', { title: 'Page heading', desc: 'Title at the top of the Services page.',
      groups: [{ title: 'Content', fields: [
        { key: 'title', label: 'Heading' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' } ]}]});
    sectionRow(c, 'services', 'process', { title: 'Process steps', desc: '“How we work” steps under the services.',
      groups: [{ title: 'Content', fields: [{ key: 'label', label: 'Section heading' }] }],
      extra: function (body, values) {
        var g = el('div', 'd-group');
        g.appendChild(el('h4', null, 'Steps'));
        var host = complexHost('steps', function () {
          return (values.steps || []).map(function (s) {
            return { title: s.title || '', text: s.text || '' };
          }).filter(function (s) { return s.title || s.text; });
        });
        if (!Array.isArray(values.steps)) values.steps = [];
        stepsEditor(host, values.steps);
        g.appendChild(host);
        body.appendChild(g);
      }});
    sectionRow(c, 'services', 'cta', { title: 'Bottom banner', desc: 'Banner under the services.',
      groups: [{ title: 'Content', fields: [
        { key: 'heading', label: 'Heading' } ]},
        { title: 'Links', fields: [
        { key: 'buttonText', label: 'Button text' }, { key: 'buttonUrl', label: 'Button link', type: 'text' } ]}]});
    renderCollection(c, 'services');
  }

  /* ── Contact / footer / more-pages tabs ───────────────────────── */
  function settingVal(key) {
    var s = (draft.settings || []).filter(function (x) { return x.key === key; })[0];
    if (!s) return '';
    return typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
  }
  function settingObj(key) {
    var s = (draft.settings || []).filter(function (x) { return x.key === key; })[0];
    if (!s) return null;
    if (s.value && typeof s.value === 'object') return JSON.parse(JSON.stringify(s.value));
    try { return JSON.parse(s.value); } catch (e) { return null; }
  }
  async function saveSettings(map, doneMsg) {
    var r = await api('/api/cms/settings', { method: 'PATCH', body: { settings: map } });
    (r.settings || []).forEach(function (ns) {
      var i = draft.settings.findIndex(function (x) { return x.key === ns.key; });
      if (i >= 0) draft.settings[i] = ns; else draft.settings.push(ns);
    });
    markDirty(); render();
    toast(doneMsg || 'Saved ✓ — not live until you Publish');
  }
  function settingsCard(parent, title, desc, rows, saveLabel) {
    // rows: [{key, label, type}]
    var card = el('div', 'sec-card');
    var info = el('div', 'sec-info');
    info.appendChild(el('div', 'sec-title', title));
    if (desc) info.appendChild(el('div', 'sec-desc', desc));
    var box = el('div');
    box.style.marginTop = '12px';
    rows.forEach(function (f) {
      var div = el('div', 'field');
      div.appendChild(el('label', null, f.label));
      var inp;
      if (f.type === 'lines') {
        inp = document.createElement('textarea');
        var arr = settingObj(f.key);
        inp.value = Array.isArray(arr) ? arr.join('\n') : settingVal(f.key);
        inp.dataset.lines = '1';
      } else {
        inp = document.createElement('input');
        inp.type = 'text';
        inp.value = settingVal(f.key);
      }
      inp.dataset.key = f.key;
      div.appendChild(inp);
      if (f.tip) div.appendChild(el('div', 'hint', f.tip));
      box.appendChild(div);
    });
    info.appendChild(box);
    card.appendChild(info);
    var acts = el('div', 'sec-actions');
    var save = el('button', 'btn small primary', saveLabel || 'Save');
    save.onclick = async function () {
      var out = {};
      box.querySelectorAll('[data-key]').forEach(function (node) {
        out[node.dataset.key] = node.dataset.lines
          ? node.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)
          : node.value;
      });
      setBusy(true, save, 'Saving…');
      try { await saveSettings(out); } catch (e) { toast(e.message, true); }
      setBusy(false, save);
    };
    acts.appendChild(save);
    card.appendChild(acts);
    parent.appendChild(card);
  }

  function renderContact(c) {
    pageHead(c, 'Contact & details', 'Contact page texts, details and social links.', [refreshBtn()]);
    var h = el('h3', null, 'Contact page');
    c.appendChild(h);
    sectionRow(c, 'contact', 'hero', { title: 'Page heading', desc: 'Title at the top of the Contact page.',
      groups: [{ title: 'Content', fields: [
        { key: 'title', label: 'Heading' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' } ]}]});
    sectionRow(c, 'contact', 'info', { title: 'Introduction', desc: 'Text next to the contact details.',
      groups: [{ title: 'Content', fields: [
        { key: 'heading', label: 'Heading' }, { key: 'description', label: 'Description', type: 'textarea' } ]}]});
    sectionRow(c, 'contact', 'form', { title: 'Form button', desc: 'Submit button on the enquiry form.',
      groups: [{ title: 'Content', fields: [{ key: 'buttonText', label: 'Button text' }] }]});
    sectionRow(c, 'contact', 'map', { title: 'Location line', desc: 'Line under the form.',
      groups: [{ title: 'Content', fields: [{ key: 'text', label: 'Text' }] }]});
    var h2 = el('h3', null, 'Details shown on the website');
    c.appendChild(h2);
    settingsCard(c, 'Contact details', 'Email, phone, office and hours.', [
      { key: 'contact.email', label: 'Email' },
      { key: 'contact.phone', label: 'Phone' },
      { key: 'contact.office', label: 'Office / address' },
      { key: 'contact.hours', label: 'Opening hours' }
    ], 'Save details');
    settingsCard(c, 'Social links', 'Shown in the footer on every page.', [
      { key: 'social.instagram', label: 'Instagram link' },
      { key: 'social.facebook', label: 'Facebook link' },
      { key: 'social.youtube', label: 'YouTube link' }
    ], 'Save links');
    settingsCard(c, 'Enquiry form options', 'Choices in the “I’m interested in” box, one per line.', [
      { key: 'contact.form.services', label: 'Options', type: 'lines' }
    ], 'Save options');
  }

  function renderFooter(c) {
    pageHead(c, 'Footer', 'Bottom area shown on every page of the website.', [refreshBtn()]);
    settingsCard(c, 'Brand & copyright', 'Name, tagline and the bottom line.', [
      { key: 'footer.tagline', label: 'Tagline under the logo' },
      { key: 'footer.copyright', label: 'Copyright line' }
    ], 'Save');
    var card = el('div', 'sec-card');
    var info = el('div', 'sec-info');
    info.appendChild(el('div', 'sec-title', 'Link columns'));
    info.appendChild(el('div', 'sec-desc', 'Every link in the footer. Labels and addresses are editable; the columns themselves stay as they are.'));
    var host = el('div');
    host.style.marginTop = '12px';
    var cols = settingObj('footer.links') || { explore: [], resources: [], connect: [] };
    var titles = settingObj('footer.titles') || {};
    var titleInputs = {};
    [['explore', 'Explore'], ['resources', 'Resources'], ['connect', 'Connect']].forEach(function (g) {
      var box = el('div', 'd-group');
      var hrow = el('div', 'pkg-head');
      var t = document.createElement('input');
      t.type = 'text'; t.value = titles[g[0]] || g[1];
      t.style.cssText = 'flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-weight:700;font-family:inherit;';
      hrow.appendChild(t);
      titleInputs[g[0]] = t;
      box.appendChild(hrow);
      (cols[g[0]] || []).forEach(function (link) {
        var row = el('div', 'link-row');
        var l = document.createElement('input');
        l.type = 'text'; l.value = link.label || ''; l.placeholder = 'Label';
        var u = document.createElement('input');
        u.type = 'text'; u.value = link.url || ''; u.placeholder = 'Address';
        [l, u].forEach(function (inp) {
          inp.style.cssText = 'flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:rgba(9,12,6,.7);color:var(--ink);font-size:14px;font-family:inherit;';
        });
        l.oninput = function () { link.label = l.value; };
        u.oninput = function () { link.url = u.value; };
        row.appendChild(l); row.appendChild(u);
        box.appendChild(row);
      });
      host.appendChild(box);
    });
    info.appendChild(host);
    card.appendChild(info);
    var acts = el('div', 'sec-actions');
    var save = el('button', 'btn small primary', 'Save footer');
    save.onclick = async function () {
      var titlesOut = {};
      Object.keys(titleInputs).forEach(function (k) { titlesOut[k] = titleInputs[k].value; });
      setBusy(true, save, 'Saving…');
      try {
        await saveSettings({ 'footer.links': cols, 'footer.titles': titlesOut }, 'Footer saved ✓ — not live until you Publish');
      } catch (e) { toast(e.message, true); }
      setBusy(false, save);
    };
    acts.appendChild(save);
    card.appendChild(acts);
    c.appendChild(card);
  }

  var MORE_PAGES = [
    ['careers', 'Careers'], ['partnerships', 'Partnerships'], ['blog', 'Blog'],
    ['research', 'Research'], ['newsletter', 'Newsletter'], ['community', 'Community'],
    ['privacy', 'Privacy'], ['refund', 'Refund']
  ];
  function renderMore(c) {
    pageHead(c, 'More pages', 'Text content on the remaining website pages.', [refreshBtn()]);
    if (!ui.morePage) {
      MORE_PAGES.forEach(function (p) {
        var card = el('div', 'sec-card');
        var info = el('div', 'sec-info');
        info.appendChild(el('div', 'sec-title', p[1]));
        var hero = findSec(p[0], 'hero');
        if (hero && hero.data && hero.data.title) info.appendChild(el('div', 'sec-preview', '“' + String(hero.data.title).slice(0, 100) + '”'));
        card.appendChild(info);
        var acts = el('div', 'sec-actions');
        var open = el('button', 'btn small primary', 'Edit');
        open.onclick = function () { ui.morePage = p[0]; render(); };
        acts.appendChild(open);
        card.appendChild(acts);
        c.appendChild(card);
      });
      return;
    }
    var slug = ui.morePage;
    var name = (MORE_PAGES.filter(function (p) { return p[0] === slug; })[0] || [slug, slug])[1];
    var back = el('button', 'btn small ghost', '← All pages');
    back.style.marginBottom = '14px';
    back.onclick = function () { ui.morePage = null; render(); };
    c.appendChild(back);
    var h = el('h2', null, name);
    c.appendChild(h);
    sectionRow(c, slug, 'hero', { title: 'Page heading', desc: 'Title at the top of the page.',
      groups: [{ title: 'Content', fields: [
        { key: 'title', label: 'Heading' }, { key: 'subtitle', label: 'Subtitle (only where the page has one)' } ]}]});
    sectionRow(c, slug, 'main', { title: 'Page text', desc: 'Headings and paragraphs in page order.',
      groups: [],
      extra: function (body, values) {
        var g = el('div', 'd-group');
        g.appendChild(el('h4', null, 'Content blocks'));
        var host = complexHost('blocks', function () {
          return (values.blocks || []).map(function (b) {
            return {
              heading: b.heading || '',
              texts: (b.texts || []).map(function (t) { return String(t == null ? '' : t); })
            };
          }).filter(function (b) { return b.heading || b.texts.join('').trim() !== ''; });
        });
        if (!Array.isArray(values.blocks)) values.blocks = [];
        blocksEditor(host, values.blocks);
        g.appendChild(host);
        body.appendChild(g);
      }});
  }

  /* ── History / activity ─────────────────────────────────────────── */
  function fmtDateTime(iso) {
    var d = new Date(iso);
    return { date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) };
  }
  async function renderHistory(c) {
    pageHead(c, 'Version history', 'Every Publish saves a snapshot. Restoring replaces your drafts — it only goes live after you Publish again.', [refreshBtn()]);
    var list = el('div');
    list.innerHTML = '<p class="muted">Loading…</p>';
    c.appendChild(list);
    try {
      var r = await api('/api/cms/versions');
      list.innerHTML = '';
      var vers = r.versions || [];
      if (!vers.length) {
        list.appendChild(emptyState('No versions yet.', 'They appear here after your first Publish.', null, null));
        return;
      }
      vers.forEach(function (v, i) {
        var num = vers.length - i;
        var when = fmtDateTime(v.created_at);
        var card = el('div', 'ver-card');
        card.appendChild(el('div', 'ver-num', 'Version ' + num));
        var meta = el('div', 'ver-meta');
        meta.appendChild(el('div', 'ver-note', v.note || 'Snapshot'));
        meta.appendChild(el('div', 'ver-sub', when.date + ' · ' + when.time + ' · ' + (v.by_email || 'Owner')));
        card.appendChild(meta);
        var acts = el('div', 'ver-actions');
        var pv = el('button', 'btn small ghost', 'Preview');
        pv.onclick = function () { previewVersion(v, num); };
        var rb = el('button', 'btn small ghost', 'Restore');
        rb.onclick = async function () {
          var ok = await confirmDialog('Restore Version ' + num + '?',
            'Your current drafts will be replaced by this snapshot. History is kept — nothing is lost. You still need to Publish to go live.', 'Restore', { okKind: 'primary' });
          if (!ok) return;
          setBusy(true, rb, 'Restoring…');
          try {
            await api('/api/cms/versions', { method: 'POST', body: { version_id: v.id } });
            await reload(true); render(); toast('Restored to drafts ✓ — press Publish to go live');
          } catch (e) { toast(e.message, true); }
          setBusy(false, rb);
        };
        acts.appendChild(pv); acts.appendChild(rb);
        card.appendChild(acts);
        list.appendChild(card);
      });
    } catch (e) { list.innerHTML = '<p class="error">' + esc(e.message) + '</p>'; }
  }
  async function previewVersion(v, num) {
    var text = (v.note || 'Snapshot') + '\n\nLoading preview…';
    confirmDialog('Version ' + num + ' preview', text, 'Close', { hideCancel: true, okKind: 'primary' });
    try {
      var r = await api('/api/cms/versions?id=' + v.id);
      var s = (r.version && r.version.snapshot) || null;
      var lines = [];
      if (s) {
        var secs = (s.sections || []).length;
        var pf = (s.portfolio || []).length, br = (s.brands || []).length;
        var sv = (s.services || []).length, tm = (s.testimonials || []).length;
        lines.push(secs + ' text sections · ' + pf + ' projects · ' + br + ' brands · ' + sv + ' services · ' + tm + ' testimonials');
        var names = (s.portfolio || []).slice(0, 6).map(function (p) { return p.title; }).filter(Boolean);
        if (names.length) lines.push('Projects include: ' + names.join(', ') + (pf > 6 ? ', …' : ''));
      }
      $('confirm-text').textContent = (v.note || 'Snapshot') + '\n\n' + (lines.join('\n') || 'No content recorded.');
    } catch (e) {
      $('confirm-text').textContent = (v.note || 'Snapshot') + '\n\nPreview is unavailable right now.';
    }
  }
  async function renderActivity(c) {
    pageHead(c, 'Recent activity', 'Who changed what, and when.', [refreshBtn()]);
    var list = el('div');
    list.innerHTML = '<p class="muted">Loading…</p>';
    c.appendChild(list);
    try {
      var r = await api('/api/cms/audit');
      list.innerHTML = '';
      var log = r.log || [];
      if (!log.length) {
        list.appendChild(emptyState('No activity yet.', 'Changes you and your team make will show up here.', null, null));
        return;
      }
      var words = { create: 'added', update: 'updated', delete: 'deleted', publish: 'published website changes', restore: 'restored a version', reorder: 'reordered', access: 'signed in', bootstrap_owner: 'claimed owner access' };
      log.forEach(function (a) {
        var row = el('div', 'log-row');
        row.appendChild(el('span', 'log-dot'));
        var main = el('div', 'log-main');
        var text = (a.meta && a.meta.summary) || (function () {
          var what = words[a.action] || a.action;
          var title = a.meta && a.meta.title ? ' “' + a.meta.title + '”' : '';
          var ent = (a.entity_type && a.entity_type !== 'session' && a.entity_type !== 'cms_users') ? ' ' + a.entity_type : '';
          return what + title + ent;
        })();
        main.textContent = (a.actor || 'Someone') + ' — ' + text;
        row.appendChild(main);
        var when = fmtDateTime(a.created_at);
        row.appendChild(el('span', 'log-time', when.date + ' · ' + when.time));
        list.appendChild(row);
      });
    } catch (e) { list.innerHTML = '<p class="error">' + esc(e.message) + '</p>'; }
  }

  /* ── Events ─────────────────────────────────────────────────────── */
  function bind() {
    document.querySelectorAll('.side-link').forEach(function (b) {
      b.onclick = function () {
        if (busy) return;
        tab = b.dataset.tab;
        ui.search = ''; ui.filter = 'all';
        if (tab !== 'more') ui.morePage = null;
        render();
        try { window.location.hash = '/manage/' + tab; } catch (e) {}
        if (window.innerWidth <= 900) $('sidebar').classList.remove('open');
      };
    });
    $('btn-menu').onclick = function () { $('sidebar').classList.toggle('open'); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('confirm').classList.contains('hidden')) return;
        if (!$('drawer').classList.contains('hidden')) requestCloseDrawer();
        else $('sidebar').classList.remove('open');
      }
    });
    $('drawer-close').onclick = requestCloseDrawer;
    $('drawer-cancel').onclick = requestCloseDrawer;
    $('drawer-scrim').onclick = requestCloseDrawer;
    $('drawer-save').onclick = async function () {
      if (!drawerSave || busy) return;
      var got = collectDrawer(true);
      if (got.bad) {
        toast('Please fill in the highlighted fields.', true);
        got.bad.focus();
        return;
      }
      setBusy(true, $('drawer-save'), 'Saving…');
      try {
        await drawerSave(got.values);
        closeDrawer();
      } catch (e) { toast((e && e.message) || 'Something went wrong. Please try again.', true); }
      setBusy(false, $('drawer-save'));
    };
    $('btn-retry').onclick = function () {
      $('signin-error').classList.add('hidden');
      $('btn-retry').classList.add('hidden');
      show('screen-loading');
      boot();
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
      var map = { portfolio: 'portfolio.html', brands: 'brands.html', services: 'services.html', contact: 'contact.html', footer: 'index.html', more: (ui.morePage || 'index') + '.html' };
      window.open((map[tab] || 'index.html') + '?cms_preview=draft', '_blank');
    };
    $('btn-publish').onclick = async function () {
      var n = unpublishedItems(draft || {}).length;
      var ok = await confirmDialog('Publish changes?',
        n ? n + ' edited item' + (n === 1 ? '' : 's') + ' will become visible on the live website.' : 'These changes will become visible on the live website.',
        'Publish', { okKind: 'primary' });
      if (!ok) return;
      setBusy(true, $('btn-publish'), 'Publishing…');
      try {
        await api('/api/cms/publish', { method: 'POST' });
        await reload(true); render(); toast('Published successfully ✓');
      } catch (e) { toast(e.message, true); }
      setBusy(false, $('btn-publish'));
    };
    window.addEventListener('beforeunload', function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
    var h = (window.location.hash || '').replace('#/manage/', '');
    if (h && ['home', 'portfolio', 'brands', 'services', 'testimonials', 'contact', 'footer', 'more', 'history', 'activity'].indexOf(h) >= 0) tab = h;
  }

  document.addEventListener('DOMContentLoaded', function () { bind(); boot(); });
})();
