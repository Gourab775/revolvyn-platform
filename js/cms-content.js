/* REVOLVYN CMS — public hydrator. Applies PUBLISHED content only.
 * If no published snapshot exists (or the API is unreachable), this script
 * does nothing and the page keeps its built-in copy — visually identical.
 * Draft preview: /manage opens pages with ?cms_preview=draft and stores a
 * short-lived Clerk token in sessionStorage; only then do we read drafts.
 * Rich text (italics, line breaks) is preserved structurally — only words
 * change, never markup. Backgrounds/animations are never touched. */
(function () {
  'use strict';
  function setText(el, v) {
    if (!el || v == null || v === '') return;
    el.textContent = String(v);
  }
  function setSrc(img, v) {
    if (!img || !v) return;
    if (img.getAttribute('src') !== v) img.setAttribute('src', v);
  }
  function setVideo(video, v, lazy, poster) {
    if (!video || !v) return;
    if (video.getAttribute('src') !== v && video.dataset.src !== v) {
      if (lazy) {
        video.dataset.src = v;
        video.removeAttribute('src');
      } else {
        video.setAttribute('src', v);
      }
      try { video.load(); } catch (e) {}
    }
    if (poster) video.setAttribute('poster', poster);
    else video.removeAttribute('poster');
  }
  function setting(s, k) {
    var v = s ? s[k] : null;
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  function settingObj(s, k) {
    var v = s ? s[k] : null;
    if (v && typeof v === 'object') return v;
    if (typeof v === 'string' && v) { try { return JSON.parse(v); } catch (e) {} }
    return null;
  }
  function hide(el, hideIt) {
    if (el && hideIt) el.style.display = 'none';
  }

  /* Italic/line-break preserving text updates. Only words change. */
  function setFirstWordEm(el, text) {
    // <em>First</em> rest…  (manifesto brand name)
    if (!el || text == null || text === '') return;
    var em = el.querySelector('em');
    var parts = String(text).split(' ');
    if (em && parts.length > 1) {
      em.textContent = parts[0];
      var node = null, n = el.firstChild;
      while (n) { if (n.nodeType === 3 && n !== em.firstChild) { node = node === em ? node : n; break; } n = n.nextSibling; }
      // find first text node that is not inside em
      var walker = document.createTreeWalker(el, window.NodeFilter ? window.NodeFilter.SHOW_TEXT : 4);
      var first = null;
      while (walker.nextNode()) {
        if (walker.currentNode.parentNode !== em) { first = walker.currentNode; break; }
      }
      if (first) {
        first.textContent = ' ' + parts.slice(1).join(' ');
        // clear any other stray text nodes outside em
        var w2 = document.createTreeWalker(el, window.NodeFilter ? window.NodeFilter.SHOW_TEXT : 4);
        var seen = false;
        var extra = [];
        while (w2.nextNode()) {
          if (w2.currentNode.parentNode === em) continue;
          if (!seen) { seen = true; continue; }
          extra.push(w2.currentNode);
        }
        extra.forEach(function (x) { x.textContent = ''; });
      } else {
        el.textContent = String(text);
      }
      return;
    }
    el.textContent = String(text);
  }
  function setMidEm(el, text) {
    // …before <em>word</em> after…  (quote)
    if (!el || text == null || text === '') return;
    var em = el.querySelector('em');
    var word = em ? em.textContent : '';
    var str = String(text);
    if (em && word && str.indexOf(word) >= 0) {
      var i = str.indexOf(word);
      var before = str.slice(0, i), after = str.slice(i + word.length);
      var kids = Array.prototype.slice.call(el.childNodes);
      var ti = 0;
      kids.forEach(function (k) {
        if (k === em) { em.textContent = word; return; }
        if (k.nodeType === 3) {
          k.textContent = ti === 0 ? before : (ti === 1 ? after : '');
          ti++;
        }
      });
      return;
    }
    el.textContent = str;
  }
  function setCtaHeading(el, text) {
    // Line one<br>line two with <em>last word</em>  (CTA banners)
    if (!el || text == null || text === '') return;
    var em = el.querySelector('em');
    var br = el.querySelector('br');
    var words = String(text).split(' ').filter(Boolean);
    if (em && br && words.length >= 2) {
      var last = words[words.length - 1];
      var line1, line2;
      if (words.length >= 3) {
        line1 = words.slice(0, words.length - 2).join(' ');
        line2 = words[words.length - 2] + ' ';
      } else {
        line1 = words[0];
        line2 = '';
      }
      var kids = Array.prototype.slice.call(el.childNodes);
      var texts = kids.filter(function (k) { return k.nodeType === 3; });
      texts.forEach(function (t, i) { t.textContent = i === 0 ? line1 : (i === 1 ? line2 : ''); });
      em.textContent = last;
      return;
    }
    if (em && words.length >= 1 && !br) {
      em.textContent = words[words.length - 1];
      var kids2 = Array.prototype.slice.call(el.childNodes);
      var first = true;
      kids2.forEach(function (k) {
        if (k === em) return;
        if (k.nodeType === 3) {
          k.textContent = first ? words.slice(0, words.length - 1).join(' ') + ' ' : '';
          first = false;
        }
      });
      return;
    }
    el.textContent = String(text);
  }

  /* Inline [label](url) links inside CMS paragraph text. */
  function setRichParagraph(p, text) {
    if (!p || text == null) return;
    var str = String(text);
    if (str === '') return;
    var hasLink = /\[[^\]]+\]\([^)]+\)/.test(str);
    if (!hasLink) {
      if (!p.querySelector('a')) p.textContent = str; // never destroy existing links silently
      return;
    }
    p.innerHTML = '';
    var re = /\[([^\]]+)\]\(([^)]+)\)/g, last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) p.appendChild(document.createTextNode(str.slice(last, m.index)));
      var a = document.createElement('a');
      a.href = m[2];
      a.textContent = m[1];
      p.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < str.length) p.appendChild(document.createTextNode(str.slice(last)));
  }

  var previewToken = null; // short-lived draft token (robust flow)
  var previewLegacy = false; // ?cms_preview=draft + session token (older flow)
  var clerkToken = null; // live Clerk session token when signed in on same origin
  var activeData = null; // current rendered draft or published data snapshot
  var activeRawDraft = null; // raw /api/cms/draft response (with section UUIDs)
  var cmsManageBase = ''; // empty on same origin, or CONTENT_SOURCE host if mirror
  var EDIT_UI = true;

  // Canonical home of the CMS backend. Mirror deployments without database
  // access fall back to reading published content from here (plain public
  // JSON over CORS — no secrets, no drafts involved).
  var CONTENT_SOURCE = 'https://revolvyn-platform-gourab-neogi.vercel.app/api/public/content';

  async function fetchPublished() {
    try {
      var res = await fetch('/api/public/content');
      if (res.ok) {
        var j = await res.json();
        if (j.published && j.content) return j.content;
      }
    } catch (e) {}
    try {
      var res2 = await fetch(CONTENT_SOURCE, { mode: 'cors' });
      if (res2.ok) {
        var j2 = await res2.json();
        if (j2.published && j2.content) return j2.content;
      }
    } catch (e) {}
    return null;
  }

  async function load() {
    var m = window.location.search.match(/[?&]cms_preview=([^&]+)/);
    var param = m ? decodeURIComponent(m[1]) : null;
    var data = null;
    try {
      if (param && param !== 'draft' && /^[0-9a-f]{64}$/i.test(param)) {
        previewToken = param;
        var r = await fetch('/api/cms/draft?preview=' + encodeURIComponent(param));
        if (!r.ok) {
          failBadge(r.status === 401
            ? 'This preview has expired. Open a new preview from the Website Manager.'
            : 'Preview unavailable right now (server error ' + r.status + '). Open it again from the Website Manager.');
          return;
        }
        var rawD = await r.json();
        activeRawDraft = rawD;
        data = normalizeDraft(rawD);
        badge();
        enterEditMode();
      } else if (param === 'draft') {
        previewLegacy = true;
        var t = null;
        try { t = sessionStorage.getItem('revolvyn_preview_token'); } catch (e) {}
        if (!t) { failBadge('Preview unavailable. Open it again from the Website Manager.'); return; }
        clerkToken = t;
        var r2 = await fetch('/api/cms/draft', { headers: { Authorization: 'Bearer ' + t } });
        if (!r2.ok) { failBadge('Preview unavailable. Open it again from the Website Manager.'); return; }
        var rawD2 = await r2.json();
        activeRawDraft = rawD2;
        data = normalizeDraft(rawD2);
        badge();
        enterEditMode();
      } else if (param) {
        failBadge('This preview link is invalid. Open a new preview from the Website Manager.');
        return;
      } else {
        data = await fetchPublished();
        try { injectGuiTrigger(); } catch (e) {}
        if (/([?&]edit=1|#edit\b)/.test(window.location.href)) {
          try { activateSiteEditor(); } catch (e) {}
        }
        if (!data) return;
      }
    } catch (e) {
      if (param) failBadge('Preview unavailable. Check your connection, then open it again from the Website Manager.');
      return;
    }
    try { apply(data); } catch (e) { /* never break the public page */ }
    try { injectGuiTrigger(); } catch (e) {}
    if (/([?&]edit=1|#edit\b)/.test(window.location.href)) {
      try { activateSiteEditor(); } catch (e) {}
    }
    try { if (param && (previewToken || previewLegacy)) positionPills(); } catch (e) {}
  }

  function failBadge(reason) {
    if (!reason) return;
    var b = document.createElement('div');
    b.textContent = reason;
    b.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);max-width:min(92vw,560px);text-align:center;background:#4a1f1f;color:#f2b6b6;border:1px solid rgba(224,138,138,.5);font:600 13px Inter,system-ui,sans-serif;padding:10px 18px;border-radius:12px;z-index:99999;';
    try { document.body.appendChild(b); } catch (e) {}
  }

  function normalizeDraft(d) {
    return {
      sections: (d.sections || []).map(function (s) {
        return { id: s.id, page: s.page_slug, key: s.section_key, data: s.data || {}, visible: s.is_visible, order: s.sort_order };
      }),
      portfolio: (d.portfolio || []).map(function (p) {
        return { title: p.title, description: p.description, thumbnail: p.thumbnail, video: p.video_url, url: p.external_url, client: p.client_name, category: p.category, layout: p.layout || 'landscape', featured: !!p.featured, visible: p.is_visible, order: p.sort_order };
      }),
      brands: (d.brands || []).map(function (b) {
        return { name: b.name, logo: b.logo, url: b.website_url, visible: b.is_visible, order: b.sort_order };
      }),
      services: (d.services || []).map(function (s) {
        return { title: s.title, description: s.description, image: s.image, icon: s.icon, details: s.details || [], visible: s.is_visible, order: s.sort_order };
      }),
      settings: Object.fromEntries((d.settings || []).map(function (s) { return [s.key, s.value]; }))
    };
  }

  function badge() {
    var b = document.createElement('div');
    b.textContent = 'Draft preview — visitors see the published site';
    b.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#d9ec7a;color:#1a220c;font:600 12px Inter,system-ui,sans-serif;padding:8px 16px;border-radius:999px;z-index:99999;';
    document.body.appendChild(b);
  }

  function section(data, page, key) {
    var found = (data.sections || []).filter(function (x) { return x.page === page && x.key === key; })[0];
    return found || null;
  }
  function secData(data, page, key) {
    var s = section(data, page, key);
    return s ? s.data : null;
  }
  function applyVisibility(data, pairs) {
    pairs.forEach(function (pr) {
      var s = section(data, pr[0], pr[1]);
      if (s && s.visible === false) {
        var els = document.querySelectorAll(pr[2]);
        for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
      }
    });
  }

  function apply(data) {
    activeData = data;
    var s = data.settings || {};
    var path = window.location.pathname;
    var page = 'index';
    if (/portfolio(\.html)?$/i.test(path)) page = 'portfolio';
    else if (/brands(\.html)?$/i.test(path)) page = 'brands';
    else if (/services(\.html)?$/i.test(path)) page = 'services';
    else if (/contact(\.html)?$/i.test(path)) page = 'contact';
    else if (/careers(\.html)?$/i.test(path)) page = 'careers';
    else if (/partnerships(\.html)?$/i.test(path)) page = 'partnerships';
    else if (/blog(\.html)?$/i.test(path)) page = 'blog';
    else if (/research(\.html)?$/i.test(path)) page = 'research';
    else if (/newsletter(\.html)?$/i.test(path)) page = 'newsletter';
    else if (/community(\.html)?$/i.test(path)) page = 'community';
    else if (/privacy(\.html)?$/i.test(path)) page = 'privacy';
    else if (/refund(\.html)?$/i.test(path)) page = 'refund';
    else if (/video(\.html)?$/i.test(path)) page = 'video';
    else if (/website(\.html)?$/i.test(path)) page = 'website';
    var isHome = page === 'index' && !!document.getElementById('scroll-container');

    applyNav(s);
    applyPreloader(s);
    if (isHome) applyHome(data);
    else if (page === 'portfolio') applyPortfolio(data, s);
    else if (page === 'website') applyWebsite(data, s);
    else if (page === 'brands') applyBrands(data);
    else if (page === 'services') applyServices(data);
    else if (page === 'contact') applyContact(data, s);
    else if (page === 'video') applyVideo(data);
    else if (page !== 'index') applySecondary(data, page);
    applyFooter(s);
  }

  function applyNav(s) {
    var navCfg = settingObj(s, 'nav.config');
    if (!navCfg) return;
    if (navCfg.brandName) {
      document.querySelectorAll('.nav-logo').forEach(function (el) { el.textContent = navCfg.brandName; });
    }
    if (Array.isArray(navCfg.links) && navCfg.links.length) {
      ['.nav-links', '.nav-mobile-overlay'].forEach(function (sel) {
        var box = document.querySelector(sel);
        if (!box) return;
        var cur = window.location.pathname.split('/').pop() || 'index.html';
        box.innerHTML = '';
        navCfg.links.forEach(function (lnk) {
          if (!lnk || !lnk.label) return;
          var a = document.createElement('a');
          a.href = lnk.url || '#';
          a.textContent = lnk.label;
          if (lnk.url && (lnk.url === cur || (cur === 'website.html' && lnk.url === 'portfolio.html'))) a.className = 'active';
          box.appendChild(a);
        });
      });
    }
  }

  function applyPreloader(s) {
    var pre = settingObj(s, 'site.preloader');
    if (pre && pre.label) setText(document.getElementById('loadingLabel'), pre.label);
  }

  function applyWebsite(data, s) {
    var wsList = settingObj(s || (data && data.settings), 'websites.catalog');
    var wsLabels = settingObj(s || (data && data.settings), 'website.labels');
    if (typeof window.renderWebsiteShowcase === 'function') {
      window.renderWebsiteShowcase(Array.isArray(wsList) ? wsList : null, wsLabels || null);
    }
  }

  /* ── Home ─────────────────────────────────────────────────────── */
  function applyHome(data) {
    applyVisibility(data, [
      ['home', 'hero', '.hero'], ['home', 'manifesto', '.manifesto'],
      ['home', 'portfolio_preview', '.pillars'], ['home', 'brands_preview', '.stats-section'],
      ['home', 'quote', '.quote-section'], ['home', 'cta', '.cta-section']
    ]);
    var hero = secData(data, 'home', 'hero');
    if (hero) {
      setText(document.querySelector('.hero-tag'), hero.tag);
      setText(document.querySelector('.hero h1'), hero.heading);
      setText(document.querySelector('.hero-sub'), hero.description);
    }
    var man = secData(data, 'home', 'manifesto');
    if (man) {
      setText(document.querySelector('.manifesto-label'), man.label);
      var mh = document.querySelector('.manifesto h2');
      if (mh && man.heading) setFirstWordEm(mh, man.heading);
    }
    var pp = secData(data, 'home', 'portfolio_preview');
    if (pp) {
      setText(document.querySelector('.pillars-header span'), pp.label);
      setText(document.querySelector('.portfolio-view-more'), pp.linkText);
      var pl = document.querySelector('.portfolio-view-more');
      if (pl && pp.linkUrl) pl.setAttribute('href', pp.linkUrl);
    }
    var bp = secData(data, 'home', 'brands_preview');
    if (bp) {
      setText(document.querySelector('.stats-label'), bp.label);
      setText(document.querySelector('.brands-more-btn'), bp.linkText);
      var bl = document.querySelector('.brands-more-btn');
      if (bl && bp.linkUrl) bl.setAttribute('href', bp.linkUrl);
    }
    var q = secData(data, 'home', 'quote');
    if (q && q.quote) {
      var bq = document.querySelector('.quote-section blockquote');
      if (bq) setMidEm(bq, q.quote);
      setText(document.querySelector('.quote-attr'), q.attribution);
    }
    var cta = secData(data, 'home', 'cta');
    if (cta) {
      var ch = document.querySelector('.cta-section h2');
      if (ch && cta.heading) setCtaHeading(ch, cta.heading);
      var cb = document.querySelector('.cta-section .cta-btn');
      if (cb) {
        if (cta.buttonText) cb.textContent = cta.buttonText;
        if (cta.buttonUrl) cb.setAttribute('href', cta.buttonUrl);
      }
    }
    // Homepage strip: featured visible projects first, then the rest — 6 total.
    var pool = (data.portfolio || []).filter(function (p) { return p.visible !== false && p.video; });
    pool.sort(function (a, b) {
      var fa = a.featured ? 0 : 1, fb = b.featured ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (a.order || 0) - (b.order || 0);
    });
    var vids = pool.slice(0, 6);
    var slots = document.querySelectorAll('.portfolio-item');
    if (vids.length && slots.length) {
      for (var i = 0; i < slots.length; i++) {
        var v = slots[i].querySelector('video');
        if (vids[i]) {
          slots[i].style.display = '';
          if (v) setVideo(v, vids[i].video, i >= 3, vids[i].thumbnail);
        } else {
          slots[i].style.display = 'none';
        }
      }
    }
    // Homepage marquee: first 5 visible brands (two loop halves)
    var hb = (data.brands || []).filter(function (b) { return b.visible !== false && b.logo; }).slice(0, 5);
    var himgs = document.querySelectorAll('.brand-logo-item img');
    if (hb.length >= 5 && himgs.length >= 10) {
      for (var j = 0; j < 10; j++) {
        setSrc(himgs[j], hb[j % 5].logo);
        himgs[j].setAttribute('alt', hb[j % 5].name || himgs[j].getAttribute('alt') || '');
      }
    }
  }

  /* ── Portfolio page ───────────────────────────────────────────── */
  function projectParams(p, i) {
    return 'brand=' + encodeURIComponent(p.title || '') +
      '&title=' + encodeURIComponent(p.title || '') +
      '&desc=' + encodeURIComponent(p.description || '') +
      '&video=' + encodeURIComponent(p.video || '') +
      '&thumb=' + encodeURIComponent(p.thumbnail || '') +
      '&orient=' + encodeURIComponent(p.layout === 'portrait' ? 'portrait' : 'landscape') +
      '&index=' + i;
  }
  function applyPortfolio(data, s) {
    var wsList = settingObj(s || (data && data.settings), 'websites.catalog');
    var pUi = settingObj(s || (data && data.settings), 'portfolio.ui');
    if (typeof window.renderPortfolioWebsites === 'function') {
      window.renderPortfolioWebsites(Array.isArray(wsList) ? wsList : null, pUi || null);
    }
    applyVisibility(data, [['portfolio', 'hero', '.portfolio-hero'], ['portfolio', 'cta', '.portfolio-cta']]);
    var hero = secData(data, 'portfolio', 'hero');
    if (hero) {
      var h1 = document.querySelector('.portfolio-hero h1');
      if (h1) {
        var em = h1.querySelector('em');
        var first = null, node = h1.firstChild;
        while (node) { if (node.nodeType === 3) { first = node; break; } node = node.nextSibling; }
        if (em && first && hero.titleA) {
          first.textContent = hero.titleA + ' ';
          if (hero.titleAccent) em.textContent = hero.titleAccent;
        } else if (hero.titleA) {
          h1.textContent = hero.titleA + (hero.titleAccent ? ' ' + hero.titleAccent : '');
        }
      }
      setText(document.querySelector('.portfolio-hero p'), hero.subtitle);
    }
    var cta = secData(data, 'portfolio', 'cta');
    if (cta) {
      var link = document.querySelector('.portfolio-cta a');
      if (link) {
        if (cta.linkText) link.textContent = cta.linkText;
        if (cta.linkUrl) link.setAttribute('href', cta.linkUrl);
      }
    }
    if (!data.portfolio) return;
    var items = data.portfolio.filter(function (p) { return p.visible !== false; });
    items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var grid = document.getElementById('collageGrid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(function (p, i) {
      var item = document.createElement('div');
      item.className = 'collage-item ' + (p.layout === 'portrait' ? 'portrait' : 'landscape') + ' revealed';
      item.setAttribute('data-order', String(i + 1));
      item.onclick = (function (pp, ii) {
        return function () {
          if (pp.url) { try { window.open(pp.url, '_blank', 'noopener'); } catch (e) {} return; }
          window.location.href = 'video.html?' + projectParams(pp, ii) + '&autoplay=1';
        };
      })(p, i);
      var video = document.createElement('video');
      video.muted = true; video.loop = true; video.playsInline = true;
      video.preload = i < 6 ? 'auto' : 'none';
      if (i < 6 && p.video) video.setAttribute('src', p.video);
      else if (p.video) video.dataset.src = p.video;
      if (p.thumbnail) video.setAttribute('poster', p.thumbnail);
      video.addEventListener('canplay', function () { video.classList.add('loaded'); }, { once: true });
      item.appendChild(video);
      var ov = document.createElement('div');
      ov.className = 'collage-overlay';
      var bn = document.createElement('div');
      bn.className = 'brand-name';
      bn.textContent = p.title || '';
      var vh = document.createElement('div');
      vh.className = 'view-hint';
      vh.textContent = 'View Project';
      ov.appendChild(bn); ov.appendChild(vh);
      item.appendChild(ov);
      if (p.url) item.setAttribute('data-href', p.url);
      grid.appendChild(item);
    });
    // play / pause rebuilt videos on visibility
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var video = en.target.querySelector('video');
          if (!video) return;
          if (en.isIntersecting) {
            if (!video.getAttribute('src') && video.dataset.src) {
              video.setAttribute('src', video.dataset.src);
              try { video.load(); } catch (e) {}
            }
            try { video.play().catch(function () {}); } catch (e) {}
          } else { try { video.pause(); } catch (e) {} }
        });
      }, { threshold: 0.01, rootMargin: '100px' });
      grid.querySelectorAll('.collage-item').forEach(function (it) { io.observe(it); });
    } catch (e) {}
  }

  /* ── Brands page ──────────────────────────────────────────────── */
  function applyBrands(data) {
    applyVisibility(data, [['brands', 'hero', '.page-hero'], ['brands', 'stats', '.brands-stats'], ['brands', 'cta', '.page-cta']]);
    var hero = secData(data, 'brands', 'hero');
    if (hero) {
      setText(document.querySelector('.page-hero h1'), hero.title);
      setText(document.querySelector('.page-hero p'), hero.subtitle);
    }
    var stats = secData(data, 'brands', 'stats');
    if (stats && Array.isArray(stats.items)) {
      var nums = document.querySelectorAll('.brands-stats .stat-number');
      var labs = document.querySelectorAll('.brands-stats .stat-label');
      stats.items.forEach(function (st, i) {
        if (nums[i] && st.number) nums[i].textContent = st.number;
        if (labs[i] && st.label) labs[i].textContent = st.label;
      });
    }
    if (data.brands) {
      var items = data.brands.filter(function (b) { return b.visible !== false; });
      var grid = document.querySelector('.brands-grid');
      if (grid) {
        grid.innerHTML = '';
        items.forEach(function (b) {
          var card = document.createElement('div');
          card.className = 'brand-card revealed';
          var img = document.createElement('img');
          if (b.logo) img.setAttribute('src', b.logo);
          img.setAttribute('alt', b.name || '');
          var nm = document.createElement('div');
          nm.className = 'brand-card-name';
          nm.textContent = b.name || '';
          card.appendChild(img); card.appendChild(nm);
          if (b.url) {
            card.style.cursor = 'pointer';
            card.onclick = (function (u) { return function () { window.open(u, '_blank', 'noopener'); }; })(b.url);
          }
          grid.appendChild(card);
        });
      }
    }
    var cta = secData(data, 'brands', 'cta');
    if (cta) {
      setText(document.querySelector('.page-cta h2'), cta.heading);
      var a = document.querySelector('.page-cta a');
      if (a) {
        if (cta.buttonText) a.textContent = cta.buttonText;
        if (cta.buttonUrl) a.setAttribute('href', cta.buttonUrl);
      }
    }
  }

  /* ── Services page ────────────────────────────────────────────── */
  function applyServices(data) {
    applyVisibility(data, [['services', 'hero', '.page-hero'], ['services', 'process', '.process-section'], ['services', 'cta', '.page-cta']]);
    var hero = secData(data, 'services', 'hero');
    if (hero) {
      setText(document.querySelector('.page-hero h1'), hero.title);
      setText(document.querySelector('.page-hero p'), hero.subtitle);
    }
    if (data.services) {
      var items = data.services.filter(function (x) { return x.visible !== false; });
      var grid = document.querySelector('.services-full-grid');
      if (grid) {
        grid.innerHTML = '';
        items.forEach(function (sv, i) {
          var card = document.createElement('div');
          card.className = 'service-full-card revealed';
          var num = document.createElement('div');
          num.className = 'service-full-num';
          num.textContent = ('0' + (i + 1)).slice(-2);
          var h3 = document.createElement('h3');
          h3.textContent = sv.title || '';
          var subs = document.createElement('div');
          subs.className = 'service-sub-packages';
          (sv.details || []).forEach(function (pkg) {
            var sp = document.createElement('div');
            sp.className = 'sub-package';
            var h4 = document.createElement('h4');
            h4.textContent = pkg.package || '';
            sp.appendChild(h4);
            var ul = document.createElement('ul');
            (pkg.items || []).forEach(function (liText) {
              var li = document.createElement('li');
              li.textContent = liText;
              ul.appendChild(li);
            });
            sp.appendChild(ul);
            if (pkg.note) {
              var note = document.createElement('div');
              note.className = 'note';
              note.textContent = pkg.note;
              sp.appendChild(note);
            }
            subs.appendChild(sp);
          });
          card.appendChild(num); card.appendChild(h3); card.appendChild(subs);
          grid.appendChild(card);
        });
      }
    }
    var proc = secData(data, 'services', 'process');
    if (proc) {
      setText(document.querySelector('.process-section .section-label'), proc.label);
      if (Array.isArray(proc.steps)) {
        var titles = document.querySelectorAll('.process-step h4');
        var texts = document.querySelectorAll('.process-step p');
        proc.steps.forEach(function (st, i) {
          if (titles[i] && st.title) titles[i].textContent = st.title;
          if (texts[i] && st.text) texts[i].textContent = st.text;
        });
      }
    }
    var cta = secData(data, 'services', 'cta');
    if (cta) {
      setText(document.querySelector('.page-cta h2'), cta.heading);
      var a = document.querySelector('.page-cta a');
      if (a) {
        if (cta.buttonText) a.textContent = cta.buttonText;
        if (cta.buttonUrl) a.setAttribute('href', cta.buttonUrl);
      }
    }
  }

  /* ── Contact page ─────────────────────────────────────────────── */
  function applyContact(data, s) {
    applyVisibility(data, [
      ['contact', 'hero', '.page-hero'], ['contact', 'info', '.contact-info'],
      ['contact', 'form', '.contact-form-wrap'], ['contact', 'map', '.map-placeholder']
    ]);
    var hero = secData(data, 'contact', 'hero');
    if (hero) {
      setText(document.querySelector('.page-hero h1'), hero.title);
      setText(document.querySelector('.page-hero p'), hero.subtitle);
    }
    var info = secData(data, 'contact', 'info');
    if (info) {
      setText(document.querySelector('.contact-info h3'), info.heading);
      setText(document.querySelector('.contact-info > p'), info.description);
    }
    var map = [['Email', setting(s, 'contact.email')], ['Phone', setting(s, 'contact.phone')],
      ['Office', setting(s, 'contact.office')], ['Hours', setting(s, 'contact.hours')]];
    document.querySelectorAll('.contact-detail').forEach(function (row) {
      var lab = row.querySelector('.contact-detail-label');
      var txt = row.querySelector('.contact-detail-text');
      if (!lab || !txt) return;
      map.forEach(function (pair) {
        if (lab.textContent.trim() === pair[0] && pair[1]) txt.textContent = pair[1];
      });
    });
    var form = secData(data, 'contact', 'form');
    if (form) setText(document.getElementById('cfSubmit'), form.buttonText);
    var svc = settingObj(s, 'contact.form.services');
    if (Array.isArray(svc) && svc.length) {
      var sel = document.getElementById('cfService');
      if (sel) {
        while (sel.options.length > 1) sel.remove(1);
        svc.forEach(function (name) {
          var o = document.createElement('option');
          o.textContent = name;
          sel.appendChild(o);
        });
      }
    }
    var mp = secData(data, 'contact', 'map');
    if (mp) setText(document.querySelector('.map-placeholder p'), mp.text);
  }

  /* ── Secondary pages (generic blocks) ─────────────────────────── */
  function applySecondary(data, page) {
    var hero = secData(data, page, 'hero');
    if (hero) {
      setText(document.querySelector('.page-hero h1'), hero.title);
      setText(document.querySelector('.page-hero p'), hero.subtitle);
    }
    var main = secData(data, page, 'main');
    if (!main || !Array.isArray(main.blocks)) return;
    var content = document.querySelector('.page-content');
    if (!content) return;
    var heads = content.querySelectorAll('h2');
    main.blocks.forEach(function (block, i) {
      var h2 = heads[i];
      if (!h2) return;
      if (block.heading) h2.textContent = block.heading;
      // following <p> siblings until the next h2
      var ps = [];
      var n = h2.nextSibling;
      while (n) {
        if (n.nodeType === 1 && /^h[1-6]$/i.test(n.tagName)) break;
        if (n.nodeType === 1 && n.tagName === 'P') ps.push(n);
        n = n.nextSibling;
      }
      (block.texts || []).forEach(function (t, ti) {
        if (t == null || t === '') return;
        if (ps[ti]) setRichParagraph(ps[ti], t);
        else {
          var p = document.createElement('p');
          var anchor = ps.length ? ps[ps.length - 1] : h2;
          anchor.parentNode.insertBefore(p, anchor.nextSibling);
          setRichParagraph(p, t);
          ps.push(p);
        }
      });
    });
  }

  /* ── Video player page ────────────────────────────────────────────
   * Dynamic title/video come from the link that opened the page (i.e. from
   * portfolio items). Only the fixed chrome labels live in the CMS, plus
   * the up-next rails which mirror the published catalogue. */
  function applyVideo(data) {
    var L = secData(data, 'video', 'labels') || {};
    setText(document.querySelector('.channel-subs'), L.channelTag);
    var share = document.querySelector('.share-btn');
    if (share && L.shareText) {
      var kids = share.childNodes, last = null;
      for (var i = 0; i < kids.length; i++) {
        if (kids[i].nodeType === 3 && kids[i].textContent.trim() !== '') last = kids[i];
      }
      if (last) last.textContent = ' ' + L.shareText;
    }
    var work = document.querySelector('.work-btn');
    if (work) {
      if (L.workText) work.textContent = L.workText;
      if (L.workUrl) work.setAttribute('href', L.workUrl);
    }
    var chead = document.querySelector('.comments-header span');
    if (chead) setText(chead, L.commentsTitle);
    var cinput = document.getElementById('commentInput');
    if (cinput && L.commentPlaceholder) cinput.setAttribute('placeholder', L.commentPlaceholder);
    document.querySelectorAll('.mobile-more-title, .sidebar-title').forEach(function (t) {
      setText(t, L.moreTitle);
    });
    var dt = document.getElementById('descToggle');
    if (dt) {
      if (L.showMore) { dt.dataset.more = L.showMore; dt.textContent = L.showMore; }
      if (L.showLess) dt.dataset.less = L.showLess;
    }
    var dm = document.getElementById('descMeta');
    if (dm && L.viewsWord) dm.dataset.viewsWord = L.viewsWord;
    var vl = document.getElementById('videoLoading');
    if (vl && L.loadingText) {
      vl.dataset.loadingText = L.loadingText;
      var s = vl.querySelector('span');
      if (s) s.textContent = L.loadingText;
    }
    var verr = document.getElementById('videoError');
    if (verr) {
      var subs = verr.childNodes, txt = null;
      for (var k = 0; k < subs.length; k++) {
        if (subs[k].nodeType === 3 && subs[k].textContent.trim() !== '') { txt = subs[k]; break; }
      }
      if (txt && L.unavailableText) txt.textContent = L.unavailableText + ' ';
      var link = verr.querySelector('a');
      if (link) {
        if (L.unavailableLinkText) link.textContent = L.unavailableLinkText;
        if (L.unavailableLinkUrl) link.setAttribute('href', L.unavailableLinkUrl);
      }
    }
    if (!data.portfolio) return;
    var items = data.portfolio.filter(function (p) { return p.visible !== false; });
    items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var curVideo = '';
    try { curVideo = new URLSearchParams(window.location.search).get('video') || ''; } catch (e) {}
    var params = {};
    try {
      params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    } catch (e) { params = {}; }
    var ex = parseInt(params.index, 10);
    if (isNaN(ex) || ex < 0 || !items[ex]) {
      ex = -1;
      if (params.video) {
        for (var xi = 0; xi < items.length; xi++) {
          if (items[xi].video && items[xi].video === params.video) { ex = xi; break; }
        }
      }
      if (ex < 0) ex = items.length ? 0 : -1; // bare player URL: mirror built-in (skip first)
    }
    var list = ex < 0 ? items.slice() : items.filter(function (_, i) { return i !== ex; });
    ['sidebarContainer', 'mobileMoreContainer'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = '';
      list.forEach(function (p) { box.appendChild(sidebarItem(p, items.indexOf(p))); });
    });
    // Keep prev/next + main player in CMS order (static fallback uses old hardcoded order).
    try {
      var prevBtn = document.getElementById('overlayPrev');
      var nextBtn = document.getElementById('overlayNext');
      if (prevBtn && nextBtn && ex >= 0) {
        var prev = ex > 0 ? items[ex - 1] : null;
        var next = ex < items.length - 1 ? items[ex + 1] : null;
        prevBtn.disabled = !prev;
        nextBtn.disabled = !next;
        prevBtn.onclick = function (e) { if (e) e.stopPropagation(); if (prev) window.location.href = 'video.html?' + projectParams(prev, ex - 1) + '&autoplay=1'; };
        nextBtn.onclick = function (e) { if (e) e.stopPropagation(); if (next) window.location.href = 'video.html?' + projectParams(next, ex + 1) + '&autoplay=1'; };
      }
      var cur = ex >= 0 ? items[ex] : null;
      if (cur) {
        // Parity with manage panel: CMS description wins even when empty,
        // so both sides show the same text instead of falling back to descBank.
        if (cur.description != null) {
          var dt = document.getElementById('descText');
          if (dt && dt.textContent !== cur.description) dt.textContent = cur.description;
        } else if (params.desc != null) {
          var dt2 = document.getElementById('descText');
          if (dt2 && dt2.textContent !== params.desc) dt2.textContent = params.desc;
        }
        var useTitle = cur.title || params.title || params.brand || '';
        if (useTitle) {
          var vt = document.getElementById('videoTitle');
          if (vt && vt.textContent !== useTitle) vt.textContent = useTitle;
        }
        // Thumbnail parity: main player poster follows CMS thumbnail.
        try {
          var mainV = document.getElementById('mainVideo');
          if (mainV) {
            var useThumb = (cur.thumbnail != null ? cur.thumbnail : (params.thumb || ''));
            if (useThumb) mainV.setAttribute('poster', useThumb);
            else mainV.removeAttribute('poster');
          }
        } catch (e2) {}
      }
    } catch (e) {}
  }
  function sidebarItem(p, idx) {
    var item = document.createElement('div');
    item.className = 'sidebar-item';
    item.setAttribute('data-index', String(idx));
    var thumb = document.createElement('div');
    thumb.className = 'sidebar-thumb';
    var cvs = document.createElement('canvas');
    cvs.width = 336; cvs.height = 188;
    var vid = document.createElement('video');
    vid.muted = true; vid.loop = true; vid.preload = 'metadata';
    // Thumbnails stay visible on every platform: load the opening frame
    // right away instead of waiting for the hover glimpse engine.
    if (p.video) vid.setAttribute('src', p.video);
    if (p.thumbnail) vid.setAttribute('poster', p.thumbnail);
    vid.style.opacity = p.thumbnail ? '0' : '1';
    thumb.appendChild(cvs); thumb.appendChild(vid);
    if (p.thumbnail) {
      var img = document.createElement('img');
      img.src = p.thumbnail;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;position:absolute;top:0;left:0;z-index:2;';
      thumb.appendChild(img);
      vid.style.zIndex = '1';
    }
    var info = document.createElement('div');
    info.className = 'sidebar-item-info';
    var title = document.createElement('div');
    title.className = 'sidebar-item-title';
    title.textContent = p.title || '';
    info.appendChild(title);
    item.appendChild(thumb); item.appendChild(info);
    item.addEventListener('click', function (e) {
      if (e) e.preventDefault();
      try { window.location.href = 'video.html?' + projectParams(p, idx) + '&autoplay=1'; } catch (err) {}
    });
    item.addEventListener('mouseenter', function () {
      if (!vid.getAttribute('src') && vid.dataset.src) {
        vid.setAttribute('src', vid.dataset.src);
        try { vid.load(); } catch (err) {}
      }
      if (p.thumbnail) { vid.style.opacity = '1'; vid.style.zIndex = '3'; }
      try { vid.play().catch(function () {}); } catch (err) {}
    });
    item.addEventListener('mouseleave', function () {
      try { vid.pause(); } catch (err) {}
      if (p.thumbnail) { vid.style.opacity = '0'; vid.style.zIndex = '1'; }
    });
    return item;
  }

  /* ── Footer (every page) ──────────────────────────────────────── */
  function applyFooter(s) {
    setText(document.querySelector('.sf-brand-desc'), setting(s, 'footer.tagline'));
    document.querySelectorAll('.sf-brand-desc').forEach(function (el) {
      var v = setting(s, 'footer.tagline');
      if (v) el.textContent = v;
    });
    document.querySelectorAll('.sf-copy').forEach(function (el) {
      var v = setting(s, 'footer.copyright');
      if (v) el.textContent = v;
    });
    var soc = { Instagram: setting(s, 'social.instagram'), Facebook: setting(s, 'social.facebook'), YouTube: setting(s, 'social.youtube') };
    document.querySelectorAll('.sf-socials a').forEach(function (a) {
      var t = a.textContent.trim();
      if (soc[t]) a.setAttribute('href', soc[t]);
    });
    var titles = settingObj(s, 'footer.titles') || {};
    var links = settingObj(s, 'footer.links') || {};
    var colKey = { Explore: 'explore', Resources: 'resources', Connect: 'connect' };
    document.querySelectorAll('.sf-col').forEach(function (col) {
      var titleEl = col.querySelector('.sf-col-title');
      var key = titleEl ? colKey[titleEl.textContent.trim()] : null;
      if (key && titles[key]) titleEl.textContent = titles[key];
      if (!key) return;
      // Full sync with the published list: update in place, append new
      // links, remove deleted ones. Same styling — only words change.
      var wanted = Array.isArray(links[key]) ? links[key] : [];
      var anchors = Array.prototype.slice.call(col.querySelectorAll('a'));
      var n = Math.max(anchors.length, wanted.length);
      for (var i = 0; i < n; i++) {
        if (i < wanted.length && i < anchors.length) {
          if (wanted[i].label) anchors[i].textContent = wanted[i].label;
          if (wanted[i].url) anchors[i].setAttribute('href', wanted[i].url);
        } else if (i < wanted.length) {
          var na = document.createElement('a');
          na.textContent = wanted[i].label || wanted[i].url || '';
          na.setAttribute('href', wanted[i].url || '#');
          col.appendChild(na);
        } else if (anchors[i]) {
          anchors[i].parentNode.removeChild(anchors[i]);
        }
      }
    });
  }

  /* ── Visual On-Page GUI Editor ───────────────────────────────────────
   * Active in /manage preview tabs (?cms_preview=...) OR whenever the owner
   * opens Site Editor (footer "Edit Site", bottom-left pill, ?edit=1, Shift+E).
   * Direct writes go strictly through authenticated /api/cms/* routes. */
  var EDIT_PILLS = [];
  var editModeActive = false;
  var clerkLoadingPromise = null;

  var EDIT_TARGETS = [
    // home
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.hero', page: 'home', key: 'hero', label: 'Edit Hero' },
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.manifesto', page: 'home', key: 'manifesto', label: 'Edit Intro' },
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.pillars', page: 'home', key: 'portfolio_preview', tab: 'portfolio', label: 'Edit Strip / Videos' },
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.stats-section', page: 'home', key: 'brands_preview', tab: 'brands', label: 'Edit Logos Strip' },
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.quote-section', page: 'home', key: 'quote', label: 'Edit Quote' },
    { match: function () { return !!document.getElementById('scroll-container'); }, sel: '.cta-section', page: 'home', key: 'cta', label: 'Edit Banner' },
    // portfolio page
    { match: function () { return /portfolio(\.html)?$/i.test(window.location.pathname); }, sel: '.portfolio-hero', page: 'portfolio', key: 'hero', label: 'Edit Heading' },
    { match: function () { return /portfolio(\.html)?$/i.test(window.location.pathname); }, sel: '#workSwitch', settingKey: 'portfolio.ui', label: 'Edit Toggle Labels' },
    { match: function () { return /portfolio(\.html)?$/i.test(window.location.pathname); }, sel: '#collageGrid', tab: 'portfolio', label: 'Manage Videos' },
    { match: function () { return /portfolio(\.html)?$/i.test(window.location.pathname); }, sel: '#websitesGrid', tab: 'websites', label: 'Manage Websites' },
    { match: function () { return /portfolio(\.html)?$/i.test(window.location.pathname); }, sel: '.portfolio-cta', page: 'portfolio', key: 'cta', label: 'Edit Button' },
    // website showcase detail page
    { match: function () { return /website(\.html)?$/i.test(window.location.pathname); }, sel: '.video-player-wrapper', activeWebsite: 'media', label: 'Edit Video & Thumb' },
    { match: function () { return /website(\.html)?$/i.test(window.location.pathname); }, sel: '.video-info', activeWebsite: 'basic', label: 'Edit Title & Live URL' },
    { match: function () { return /website(\.html)?$/i.test(window.location.pathname); }, sel: '.features-box', activeWebsite: 'features', label: 'Edit Website Features' },
    { match: function () { return /website(\.html)?$/i.test(window.location.pathname); }, sel: '.tech-box:not(.features-box)', activeWebsite: 'tech', label: 'Edit Tech Stack' },
    { match: function () { return /website(\.html)?$/i.test(window.location.pathname); }, sel: '#desktopSidebar, #mobileMoreSection', settingKey: 'website.labels', tab: 'websites', label: 'Edit Labels / Manage Sites' },
    // brands page
    { match: function () { return /brands(\.html)?$/i.test(window.location.pathname); }, sel: '.page-hero', page: 'brands', key: 'hero', label: 'Edit Heading' },
    { match: function () { return /brands(\.html)?$/i.test(window.location.pathname); }, sel: '.brands-stats', page: 'brands', key: 'stats', label: 'Edit Numbers' },
    { match: function () { return /brands(\.html)?$/i.test(window.location.pathname); }, sel: '.brands-grid', tab: 'brands', label: 'Manage Brands' },
    { match: function () { return /brands(\.html)?$/i.test(window.location.pathname); }, sel: '.page-cta', page: 'brands', key: 'cta', label: 'Edit Banner' },
    // services page
    { match: function () { return /services(\.html)?$/i.test(window.location.pathname); }, sel: '.page-hero', page: 'services', key: 'hero', label: 'Edit Heading' },
    { match: function () { return /services(\.html)?$/i.test(window.location.pathname); }, sel: '.services-full-grid', tab: 'services', label: 'Manage Services' },
    { match: function () { return /services(\.html)?$/i.test(window.location.pathname); }, sel: '.process-section', page: 'services', key: 'process', label: 'Edit Steps' },
    { match: function () { return /services(\.html)?$/i.test(window.location.pathname); }, sel: '.page-cta', page: 'services', key: 'cta', label: 'Edit Banner' },
    // contact page
    { match: function () { return /contact(\.html)?$/i.test(window.location.pathname); }, sel: '.page-hero', page: 'contact', key: 'hero', label: 'Edit Heading' },
    { match: function () { return /contact(\.html)?$/i.test(window.location.pathname); }, sel: '.contact-info', page: 'contact', key: 'info', label: 'Edit Info' },
    { match: function () { return /contact(\.html)?$/i.test(window.location.pathname); }, sel: '.contact-form-wrap', page: 'contact', key: 'form', label: 'Edit Form' },
    { match: function () { return /contact(\.html)?$/i.test(window.location.pathname); }, sel: '.map-placeholder', page: 'contact', key: 'map', label: 'Edit Line' },
    // secondary pages
    { match: function () { return /(careers|partnerships|blog|research|newsletter|community|privacy|refund)(\.html)?$/i.test(window.location.pathname); }, sel: '.page-hero', page: null, key: 'hero', label: 'Edit Heading' },
    { match: function () { return /(careers|partnerships|blog|research|newsletter|community|privacy|refund)(\.html)?$/i.test(window.location.pathname); }, sel: '.page-content', page: null, key: 'main', label: 'Edit Text' },
    // footer everywhere
    { match: function () { return !!document.querySelector('.site-footer'); }, sel: '.site-footer', settingKey: 'footer', tab: 'footer', label: 'Edit Footer' }
  ];

  function canonicalManageUrl(tabOrSlug) {
    var base = '';
    try {
      var origin = CONTENT_SOURCE.replace(/\/api\/public\/content$/, '');
      if (cmsManageBase) base = cmsManageBase;
      else base = (window.location.origin === origin ? '' : origin);
    } catch (e) {}
    return base + '/manage' + (tabOrSlug ? '#/manage/' + tabOrSlug : '');
  }

  function injectGuiTrigger() {
    if (document.getElementById('cmsQuickEditBtn') || document.querySelector('.sf-edit-site-btn')) return;
    var footerBottom = document.querySelector('.site-footer .sf-bottom');
    if (footerBottom) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sf-edit-site-btn';
      btn.textContent = 'Edit Site';
      btn.style.cssText = 'background:none;border:none;color:rgba(215,230,190,0.48);font:500 12px Inter,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:2px 4px;';
      btn.onclick = function () { activateSiteEditor(); };
      footerBottom.insertBefore(btn, footerBottom.children[1] || null);
    } else if (/\/(website|video)(\.html)?$/i.test(window.location.pathname)) {
      var corner = document.createElement('button');
      corner.type = 'button';
      corner.id = 'cmsQuickEditBtn';
      corner.textContent = 'Edit Site';
      corner.style.cssText = 'position:fixed;bottom:14px;left:18px;z-index:900;background:rgba(15,18,12,0.86);color:#e6f578;border:1px solid rgba(230,245,120,0.28);border-radius:999px;padding:6px 13px;font:600 11px Inter,sans-serif;letter-spacing:0.6px;cursor:pointer;opacity:0.55;transition:opacity 0.2s,transform 0.2s;backdrop-filter:blur(8px);';
      corner.onmouseenter = function () { corner.style.opacity = '1'; };
      corner.onmouseleave = function () { corner.style.opacity = '0.55'; };
      corner.onclick = function () { activateSiteEditor(); };
      document.body.appendChild(corner);
    }
    if (!window.__cmsShortcutBound) {
      window.__cmsShortcutBound = true;
      window.addEventListener('keydown', function (e) {
        if (e.shiftKey && (e.key === 'E' || e.key === 'e') && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) {
          e.preventDefault();
          activateSiteEditor();
        }
      });
    }
  }

  async function resolveClerkAuth() {
    if (clerkToken) return clerkToken;
    try {
      var cfgRes = await fetch('/api/public/config', { cache: 'no-store' });
      if (!cfgRes.ok) return null;
      var cfg = await cfgRes.json();
      if (!cfg || !cfg.clerkPublishableKey || !cfg.manageEnabled) return null;
      if (!window.Clerk && !clerkLoadingPromise) {
        clerkLoadingPromise = new Promise(function (resolve) {
          var settled = false;
          var done = function () { if (!settled) { settled = true; resolve(); } };
          var timer = setTimeout(done, 2500);
          var s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
          s.crossOrigin = 'anonymous';
          s.setAttribute('data-clerk-publishable-key', cfg.clerkPublishableKey);
          s.onload = function () { clearTimeout(timer); done(); };
          s.onerror = function () { clearTimeout(timer); done(); };
          document.head.appendChild(s);
        });
      }
      if (clerkLoadingPromise) await clerkLoadingPromise;
      if (window.Clerk) {
        if (!window.Clerk.loaded) {
          await Promise.race([
            window.Clerk.load(),
            new Promise(function (resolve) { setTimeout(resolve, 2500); })
          ]);
        }
        if (window.Clerk.session) {
          clerkToken = await window.Clerk.session.getToken();
          return clerkToken;
        }
      }
    } catch (e) {}
    return null;
  }

  async function cmsApiFetch(path, opts) {
    var tk = await resolveClerkAuth();
    if (!tk) {
      var err = new Error('Please sign in at /manage to save live CMS changes.');
      err.needAuth = true;
      throw err;
    }
    opts = opts || {};
    var res = await fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    var jd = null;
    try { jd = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((jd && jd.error) || 'Request failed (' + res.status + ')');
    return jd || {};
  }

  async function ensureEditableData() {
    if (activeRawDraft) return normalizeDraft(activeRawDraft);
    try {
      var tk = await resolveClerkAuth();
      if (tk) {
        var r = await fetch('/api/cms/draft', { headers: { Authorization: 'Bearer ' + tk } });
        if (r.ok) {
          activeRawDraft = await r.json();
          activeData = normalizeDraft(activeRawDraft);
          apply(activeData);
          return activeData;
        }
      }
    } catch (e) {}
    if (!activeData) {
      activeData = { sections: [], portfolio: [], brands: [], services: [], settings: {} };
    }
    return activeData;
  }

  function activateSiteEditor() {
    if (editModeActive) return;
    enterEditMode();
    previewToast('Visual Edit Mode active — click any Edit pill on the page');
    ensureEditableData().then(function () {
      if (editModeActive) positionPills();
    }).catch(function () {});
  }

  function exitEditMode() {
    editModeActive = false;
    var bar = document.querySelector('.cmsedit-bar');
    if (bar) bar.remove();
    var dr = document.getElementById('cmsInPageDrawer');
    if (dr) dr.remove();
    document.querySelectorAll('.cmsedit-pill').forEach(function (p) { p.remove(); });
    EDIT_PILLS = [];
    document.body.style.paddingTop = '';
  }

  function enterEditMode() {
    try {
      if (editModeActive) { positionPills(); return; }
      editModeActive = true;
      if (!document.getElementById('cmsedit-styles')) {
        var css = document.createElement('style');
        css.id = 'cmsedit-styles';
        css.textContent = '.cmsedit-bar{position:fixed;top:0;left:0;right:0;z-index:99990;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 16px;background:rgba(10,13,7,.95);border-bottom:1px solid rgba(150,190,120,.28);font:500 13px Inter,system-ui,sans-serif;color:#eef2e4;backdrop-filter:blur(10px);flex-wrap:wrap}' +
          '.cmsedit-bar .l{display:flex;align-items:center;gap:9px;min-width:0}.cmsedit-dot{width:8px;height:8px;border-radius:50%;background:#d9ec7a;flex-shrink:0}' +
          '.cmsedit-bar button,.cmsedit-bar a{font:600 12px Inter,system-ui,sans-serif;border-radius:8px;padding:7px 13px;cursor:pointer;border:1px solid rgba(150,190,120,.35);background:none;color:#d7e6be;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center}' +
          '.cmsedit-bar button.solid{background:#d9ec7a;border-color:#d9ec7a;color:#1a220c}' +
          '.cmsedit-pill{position:fixed;z-index:99990;font:600 12px Inter,system-ui,sans-serif;color:#1a220c;background:#d9ec7a;border:none;border-radius:999px;padding:7px 14px;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.55);white-space:nowrap;transition:transform .15s,filter .15s}' +
          '.cmsedit-pill:hover{filter:brightness(1.07);transform:scale(1.03)}' +
          '.cmsedit-toast{position:fixed;bottom:56px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(26,33,17,.97);border:1px solid rgba(217,236,122,.4);color:#eef2e4;font:500 13.5px Inter,system-ui,sans-serif;padding:11px 20px;border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.55);max-width:92vw;text-align:center}' +
          '.cms-ip-drawer{position:fixed;inset:0;z-index:99995;display:flex;justify-content:flex-end;font-family:Inter,system-ui,sans-serif}' +
          '.cms-ip-scrim{position:absolute;inset:0;background:rgba(0,0,0,.68);backdrop-filter:blur(4px)}' +
          '.cms-ip-panel{position:relative;width:min(520px,100vw);height:100%;background:#11150e;color:#f0f4e6;border-left:1px solid rgba(150,190,120,.25);display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(0,0,0,.6)}' +
          '.cms-ip-head{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;gap:12px}' +
          '.cms-ip-head h3{font-size:17px;font-weight:600;margin:0}.cms-ip-close{background:none;border:1px solid rgba(255,255,255,.2);color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px}' +
          '.cms-ip-body{flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px}' +
          '.cms-ip-field{display:flex;flex-direction:column;gap:6px}.cms-ip-field label{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#b8c89e;font-weight:600}' +
          '.cms-ip-field input,.cms-ip-field textarea{width:100%;background:#090c06;border:1px solid rgba(150,190,120,.25);border-radius:8px;padding:10px 12px;color:#f4f7ec;font:400 14px Inter,sans-serif}' +
          '.cms-ip-field textarea{min-height:92px;resize:vertical}' +
          '.cms-ip-foot{padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}' +
          '.cms-ip-btn{padding:9px 16px;border-radius:8px;font:600 13px Inter,sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:none;color:#eef2e4}' +
          '.cms-ip-btn.primary{background:#d9ec7a;border-color:#d9ec7a;color:#1a220c}';
        document.head.appendChild(css);
      }
      if (!EDIT_UI) return;

      var bar = document.createElement('div');
      bar.className = 'cmsedit-bar';
      var left = document.createElement('div');
      left.className = 'l';
      var dot = document.createElement('span');
      dot.className = 'cmsedit-dot';
      var txt = document.createElement('span');
      txt.textContent = 'Visual Site Editor — click any green Edit pill to modify text, features & media';
      left.appendChild(dot); left.appendChild(txt);

      var right = document.createElement('div');
      right.style.display = 'flex'; right.style.gap = '8px'; right.style.flexWrap = 'wrap';

      var jumpSel = document.createElement('select');
      jumpSel.id = 'cmsBarSectionSelect';
      jumpSel.style.cssText = 'padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.22);background:rgba(17,22,19,0.92);color:#f3f5ef;font:600 11.5px/1 Inter,sans-serif;cursor:pointer;max-width:210px;';
      var defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = 'Jump & Edit Section…';
      jumpSel.appendChild(defOpt);

      var matchedTargets = [];
      EDIT_TARGETS.forEach(function (t) {
        var on = false;
        try { on = t.match(); } catch (e) {}
        if (!on) return;
        var target = document.querySelector(t.sel);
        if (!target) return;
        matchedTargets.push(t);
        var opt = document.createElement('option');
        opt.value = String(matchedTargets.length - 1);
        opt.textContent = t.label;
        jumpSel.appendChild(opt);
      });
      jumpSel.onchange = function () {
        if (!jumpSel.value) return;
        var chosen = matchedTargets[Number(jumpSel.value)];
        jumpSel.value = '';
        if (!chosen) return;
        var el = document.querySelector(chosen.sel);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        requestEdit(chosen);
      };

      var navBtn = document.createElement('button');
      navBtn.textContent = 'Edit Navigation';
      navBtn.onclick = function () { openSettingsInlineEditor({ settingKey: 'nav.config' }); };

      var fullBtn = document.createElement('button');
      fullBtn.textContent = 'Full Manager (/manage)';
      fullBtn.onclick = function () {
        try { if (window.opener && !window.opener.closed) { window.opener.focus(); return; } } catch (e) {}
        window.open(canonicalManageUrl(currentTabForPage()), '_blank');
      };

      var pubBtn = document.createElement('button');
      pubBtn.className = 'solid';
      pubBtn.textContent = 'Publish Live';
      pubBtn.onclick = async function () {
        if (!window.confirm('Publish all saved draft changes to the live website?')) return;
        pubBtn.disabled = true; pubBtn.textContent = 'Publishing…';
        try {
          await cmsApiFetch('/api/cms/publish', { method: 'POST' });
          previewToast('Published live ✓');
        } catch (e) {
          if (e.needAuth) window.open(canonicalManageUrl(currentTabForPage()), '_blank');
          else previewToast(e.message);
        }
        pubBtn.disabled = false; pubBtn.textContent = 'Publish Live';
      };

      var exitBtn = document.createElement('button');
      exitBtn.textContent = 'Exit Editor';
      exitBtn.onclick = exitEditMode;

      right.appendChild(jumpSel); right.appendChild(navBtn); right.appendChild(fullBtn); right.appendChild(pubBtn); right.appendChild(exitBtn);
      bar.appendChild(left); bar.appendChild(right);
      document.body.appendChild(bar);
      document.body.style.paddingTop = '50px';

      matchedTargets.forEach(function (t) {
        var pill = document.createElement('button');
        pill.className = 'cmsedit-pill';
        pill.textContent = t.label;
        pill.style.display = 'none';
        pill.onclick = function () { requestEdit(t); };
        document.body.appendChild(pill);
        EDIT_PILLS.push({ sel: t.sel, pill: pill, def: t });
      });

      var tick = false;
      var schedule = function () {
        if (tick) return;
        tick = true;
        (window.requestAnimationFrame || setTimeout)(function () { tick = false; positionPills(); });
      };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      window.addEventListener('message', function (e) {
        try {
          if (e.origin !== window.location.origin) return;
          var m = e.data;
          if (!m || m.ns !== 'revolvyn-cms') return;
          if (m.kind === 'draft-updated') refreshDraft(true);
        } catch (err) {}
      });
      positionPills();
    } catch (e) { /* preview extras must never break the page */ }
  }

  function currentTabForPage() {
    var p = currentPageSlug();
    if (p === 'website') return 'websites';
    if (p === 'video') return 'portfolio';
    if (['home', 'portfolio', 'brands', 'services', 'contact'].indexOf(p) >= 0) return p;
    return 'more';
  }

  function openInPageDrawer(opts) {
    var old = document.getElementById('cmsInPageDrawer');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'cmsInPageDrawer';
    wrap.className = 'cms-ip-drawer';

    var scrim = document.createElement('div');
    scrim.className = 'cms-ip-scrim';
    scrim.onclick = function () { wrap.remove(); };

    var panel = document.createElement('div');
    panel.className = 'cms-ip-panel';

    var head = document.createElement('div');
    head.className = 'cms-ip-head';
    var h3 = document.createElement('h3');
    h3.textContent = opts.title || 'Edit Section';
    var cls = document.createElement('button');
    cls.type = 'button'; cls.className = 'cms-ip-close'; cls.innerHTML = '&times;';
    cls.onclick = function () { wrap.remove(); };
    head.appendChild(h3); head.appendChild(cls);

    var body = document.createElement('div');
    body.className = 'cms-ip-body';
    var inputs = {};
    (opts.fields || []).forEach(function (f) {
      var fld = document.createElement('div');
      fld.className = 'cms-ip-field';
      var lbl = document.createElement('label');
      lbl.textContent = f.label;
      var inp = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (f.type !== 'textarea') inp.type = 'text';
      inp.value = f.value == null ? '' : String(f.value);
      inputs[f.key] = inp;
      fld.appendChild(lbl); fld.appendChild(inp);
      body.appendChild(fld);
    });

    var foot = document.createElement('div');
    foot.className = 'cms-ip-foot';
    var mgr = document.createElement('button');
    mgr.type = 'button'; mgr.className = 'cms-ip-btn';
    mgr.textContent = 'Open in Full Manager';
    mgr.onclick = function () {
      try {
        if (window.opener && !window.opener.closed && opts.openerMsg) {
          window.opener.postMessage(opts.openerMsg, window.location.origin);
          window.opener.focus();
          return;
        }
      } catch (e) {}
      window.open(canonicalManageUrl(opts.manageTab || currentTabForPage()), '_blank');
    };

    var rightGrp = document.createElement('div');
    rightGrp.style.display = 'flex'; rightGrp.style.gap = '8px';
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button'; cancelBtn.className = 'cms-ip-btn'; cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function () { wrap.remove(); };

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button'; saveBtn.className = 'cms-ip-btn primary'; saveBtn.textContent = 'Save Draft';
    saveBtn.onclick = async function () {
      var values = {};
      Object.keys(inputs).forEach(function (k) { values[k] = inputs[k].value; });
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      try {
        await opts.onSave(values);
        wrap.remove();
        positionPills();
        previewToast('Saved ✓ (Click Publish Live in top bar to go live)');
      } catch (err) {
        if (err && err.needAuth) {
          previewToast('Please sign in at /manage to save live CMS changes — opening Manager…');
          window.open(canonicalManageUrl(opts.manageTab || currentTabForPage()), '_blank');
        } else {
          previewToast((err && err.message) || 'Could not save changes.');
        }
      }
      saveBtn.disabled = false; saveBtn.textContent = 'Save Draft';
    };

    rightGrp.appendChild(cancelBtn); rightGrp.appendChild(saveBtn);
    foot.appendChild(mgr); foot.appendChild(rightGrp);
    panel.appendChild(head); panel.appendChild(body); panel.appendChild(foot);
    wrap.appendChild(scrim); wrap.appendChild(panel);
    document.body.appendChild(wrap);
  }

  function getActiveCatalogForEdit() {
    var s = (activeData && activeData.settings) || {};
    var custom = settingObj(s, 'websites.catalog');
    if (Array.isArray(custom) && custom.length) return JSON.parse(JSON.stringify(custom));
    return (window.REVOLVYN_WEBSITES || []).map(function (w, i) {
      return Object.assign({ visible: true, order: i }, JSON.parse(JSON.stringify(w)));
    });
  }

  function openWebsiteInlineEditor(def) {
    var active = window.__ACTIVE_WEBSITE_SITE || (window.REVOLVYN_WEBSITES || [])[0];
    if (!active) return;
    var mode = def.activeWebsite || 'basic';
    var openerMsg = { ns: 'revolvyn-cms', kind: 'edit', tab: 'websites', slug: active.slug };

    var fieldsByMode = {
      media: [
        { key: 'video', label: 'Showcase Video URL', value: active.video || '' },
        { key: 'thumb', label: 'Poster Thumbnail URL', value: active.thumb || '' }
      ],
      basic: [
        { key: 'title', label: 'Short Title', value: active.title || '' },
        { key: 'fullTitle', label: 'Full Display Title', value: active.fullTitle || '' },
        { key: 'category', label: 'Category', value: active.category || '' },
        { key: 'liveUrl', label: 'Live Site URL', value: active.liveUrl || '' }
      ],
      features: [
        { key: 'userSummary', label: 'Plain-Language Summary', type: 'textarea', value: active.userSummary || '' },
        { key: 'bestFor', label: 'Best For', value: active.bestFor || '' },
        { key: 'userActions', label: 'Key User Actions', value: active.userActions || '' },
        { key: 'usability', label: 'Experience & Access', value: active.usability || '' },
        { key: 'siteFeaturesText', label: 'What Visitors Can Do (one per line)', type: 'textarea', value: (active.siteFeatures || []).join('\n') }
      ],
      tech: [
        { key: 'techSummary', label: 'Technical Summary', type: 'textarea', value: active.techSummary || '' },
        { key: 'stackText', label: 'Tech Stack Chips (one per line)', type: 'textarea', value: (active.stack || []).join('\n') },
        { key: 'techFeaturesText', label: 'Architecture & Technical Build (one per line)', type: 'textarea', value: (active.techFeatures || []).join('\n') }
      ]
    };

    openInPageDrawer({
      title: def.label + ' — ' + (active.title || active.slug),
      fields: fieldsByMode[mode] || fieldsByMode.basic,
      manageTab: 'websites',
      openerMsg: openerMsg,
      onSave: async function (v) {
        var list = getActiveCatalogForEdit();
        var i = list.findIndex(function (x) { return x.slug === active.slug; });
        if (i < 0) return;
        if (mode === 'media') {
          list[i].video = v.video.trim();
          list[i].thumb = v.thumb.trim();
        } else if (mode === 'basic') {
          list[i].title = v.title.trim();
          list[i].fullTitle = v.fullTitle.trim();
          list[i].category = v.category.trim();
          list[i].liveUrl = v.liveUrl.trim() || null;
        } else if (mode === 'features') {
          list[i].userSummary = v.userSummary.trim();
          list[i].bestFor = v.bestFor.trim();
          list[i].userActions = v.userActions.trim();
          list[i].usability = v.usability.trim();
          list[i].siteFeatures = v.siteFeaturesText.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        } else if (mode === 'tech') {
          list[i].techSummary = v.techSummary.trim();
          list[i].stack = v.stackText.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
          list[i].techFeatures = v.techFeaturesText.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        }
        await cmsApiFetch('/api/cms/settings', { method: 'PATCH', body: { settings: { 'websites.catalog': list } } });
        activeData.settings['websites.catalog'] = list;
        apply(activeData);
      }
    });
  }

  function openSettingsInlineEditor(def) {
    var s = (activeData && activeData.settings) || {};
    var key = def.settingKey;
    if (key === 'nav.config') {
      var nav = settingObj(s, 'nav.config') || {
        brandName: (document.querySelector('.nav-logo') || {}).textContent || 'REVOLVYN',
        links: Array.prototype.slice.call(document.querySelectorAll('.nav-links a')).map(function (a) {
          return { label: a.textContent.trim(), url: a.getAttribute('href') };
        })
      };
      openInPageDrawer({
        title: 'Edit Top Navigation Bar',
        manageTab: 'home',
        fields: [
          { key: 'brandName', label: 'Brand Logo Text', value: nav.brandName || 'REVOLVYN' },
          { key: 'linksLines', label: 'Menu Links (Label | url per line)', type: 'textarea', value: (nav.links || []).map(function (l) { return l.label + ' | ' + l.url; }).join('\n') }
        ],
        onSave: async function (v) {
          var links = v.linksLines.split('\n').map(function (row) {
            var parts = row.split('|');
            return { label: (parts[0] || '').trim(), url: (parts[1] || '#').trim() };
          }).filter(function (x) { return x.label; });
          var next = { brandName: v.brandName.trim() || 'REVOLVYN', links: links };
          await cmsApiFetch('/api/cms/settings', { method: 'PATCH', body: { settings: { 'nav.config': next } } });
          activeData.settings['nav.config'] = next;
          apply(activeData);
        }
      });
    } else if (key === 'portfolio.ui') {
      var pui = settingObj(s, 'portfolio.ui') || {
        videosLabel: (document.querySelector('#tabVideos span') || {}).textContent || 'Videos',
        websitesLabel: (document.querySelector('#tabWebsites span') || {}).textContent || 'Websites'
      };
      openInPageDrawer({
        title: 'Edit Portfolio Toggle Labels',
        manageTab: 'portfolio',
        fields: [
          { key: 'videosLabel', label: 'Videos Switch Label', value: pui.videosLabel || 'Videos' },
          { key: 'websitesLabel', label: 'Websites Switch Label', value: pui.websitesLabel || 'Websites' }
        ],
        onSave: async function (v) {
          var next = { videosLabel: v.videosLabel.trim() || 'Videos', websitesLabel: v.websitesLabel.trim() || 'Websites' };
          await cmsApiFetch('/api/cms/settings', { method: 'PATCH', body: { settings: { 'portfolio.ui': next } } });
          activeData.settings['portfolio.ui'] = next;
          apply(activeData);
        }
      });
    } else if (key === 'website.labels') {
      var lbl = settingObj(s, 'website.labels') || {
        featuresHeading: (document.getElementById('featuresHeading') || {}).textContent || 'Website Features',
        techHeading: (document.getElementById('techHeading') || {}).textContent || 'Technology Stack',
        exploreHeading: (document.querySelector('.sidebar-title') || {}).textContent || 'Explore Other Websites',
        livePreviewText: (document.querySelector('#livePreviewBtn span') || {}).textContent || 'Live Preview',
        workText: (document.querySelector('.work-btn') || {}).textContent || 'Work With Us',
        workUrl: (document.querySelector('.work-btn') || { getAttribute: function () { return 'contact.html'; } }).getAttribute('href')
      };
      openInPageDrawer({
        title: 'Edit Website Showcase Labels',
        manageTab: 'websites',
        openerMsg: { ns: 'revolvyn-cms', kind: 'edit', tab: 'websites' },
        fields: [
          { key: 'featuresHeading', label: 'Features Heading', value: lbl.featuresHeading },
          { key: 'techHeading', label: 'Tech Stack Heading', value: lbl.techHeading },
          { key: 'exploreHeading', label: 'Sidebar Heading', value: lbl.exploreHeading },
          { key: 'livePreviewText', label: 'Live Preview Button Text', value: lbl.livePreviewText },
          { key: 'workText', label: 'Work CTA Text', value: lbl.workText },
          { key: 'workUrl', label: 'Work CTA URL', value: lbl.workUrl }
        ],
        onSave: async function (v) {
          await cmsApiFetch('/api/cms/settings', { method: 'PATCH', body: { settings: { 'website.labels': v } } });
          activeData.settings['website.labels'] = v;
          apply(activeData);
        }
      });
    } else if (key === 'footer') {
      var tg = setting(s, 'footer.tagline') || (document.querySelector('.sf-brand-desc') || {}).textContent || '';
      var cp = setting(s, 'footer.copyright') || (document.querySelector('.sf-copy') || {}).textContent || '';
      openInPageDrawer({
        title: 'Edit Footer',
        manageTab: 'footer',
        openerMsg: { ns: 'revolvyn-cms', kind: 'edit', tab: 'footer' },
        fields: [
          { key: 'tagline', label: 'Tagline', type: 'textarea', value: tg },
          { key: 'copyright', label: 'Copyright Line', value: cp }
        ],
        onSave: async function (v) {
          var patch = { 'footer.tagline': v.tagline.trim(), 'footer.copyright': v.copyright.trim() };
          await cmsApiFetch('/api/cms/settings', { method: 'PATCH', body: { settings: patch } });
          activeData.settings['footer.tagline'] = patch['footer.tagline'];
          activeData.settings['footer.copyright'] = patch['footer.copyright'];
          apply(activeData);
        }
      });
    }
  }

  function openSectionInlineEditor(def) {
    var page = def.page || currentPageSlug();
    var sec = section(activeData, page, def.key);
    var openerMsg = { ns: 'revolvyn-cms', kind: 'edit', page: page, key: def.key, tab: def.tab || null };
    if (!sec || !sec.id) {
      // No section row ID in current snapshot — hand off or open /manage
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(openerMsg, window.location.origin);
          window.opener.focus();
          previewToast('Opening editor in Website Manager…');
          return;
        }
      } catch (e) {}
      openInPageDrawer({
        title: def.label,
        manageTab: def.tab || currentTabForPage(),
        openerMsg: openerMsg,
        fields: [{ key: '_info', label: 'Sign in required to load editable fields', value: 'Click Open in Full Manager below to sign in and edit.' }],
        onSave: async function () { window.open(canonicalManageUrl(def.tab || currentTabForPage()), '_blank'); }
      });
      return;
    }
    var d = sec.data || {};
    var fields = Object.keys(d).filter(function (k) {
      return typeof d[k] === 'string' || typeof d[k] === 'number';
    }).map(function (k) {
      var val = String(d[k]);
      return { key: k, label: k.replace(/([A-Z])/g, ' $1'), type: val.length > 70 ? 'textarea' : 'text', value: val };
    });
    if (!fields.length) {
      window.open(canonicalManageUrl(def.tab || currentTabForPage()), '_blank');
      return;
    }
    openInPageDrawer({
      title: def.label,
      manageTab: def.tab || currentTabForPage(),
      openerMsg: openerMsg,
      fields: fields,
      onSave: async function (vals) {
        var nextData = Object.assign({}, d, vals);
        await cmsApiFetch('/api/cms/sections', { method: 'PATCH', body: { sections: [{ id: sec.id, data: nextData }] } });
        sec.data = nextData;
        apply(activeData);
      }
    });
  }

  function positionPills() {
    var vh = window.innerHeight || 800;
    var vw = window.innerWidth || 1200;
    EDIT_PILLS.forEach(function (p) {
      var target = null;
      try { target = document.querySelector(p.sel); } catch (e) {}
      var r = null;
      try { r = target ? target.getBoundingClientRect() : null; } catch (e) {}
      if (!r || r.width < 10 || r.height < 10 || r.bottom < 60 || r.top > vh) { p.pill.style.display = 'none'; return; }
      p.pill.style.display = '';
      var w = p.pill.offsetWidth || 120;
      var top = Math.max(r.top + 10, 58);
      var left = Math.min(Math.max(r.right - w - 10, 8), vw - w - 8);
      p.pill.style.top = top + 'px';
      p.pill.style.left = left + 'px';
    });
  }

  function previewToast(msg) {
    try {
      var old = document.querySelector('.cmsedit-toast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.className = 'cmsedit-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
    } catch (e) {}
  }

  function requestEdit(def) {
    if (def.activeWebsite) { openWebsiteInlineEditor(def); return; }
    if (def.settingKey) { openSettingsInlineEditor(def); return; }
    if (def.key) { openSectionInlineEditor(def); return; }
    var msg = { ns: 'revolvyn-cms', kind: 'edit', page: def.page || currentPageSlug(), key: null, tab: def.tab || null };
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(msg, window.location.origin);
        window.opener.focus();
        previewToast('Opening in Website Manager…');
        return;
      }
    } catch (e) {}
    window.open(canonicalManageUrl(def.tab || currentTabForPage()), '_blank');
  }

  function currentPageSlug() {
    var path = window.location.pathname;
    var m = path.match(/([a-z]+)(?:\.html)?$/i);
    return m ? m[1] : 'home';
  }

  async function refreshDraft(silent) {
    try {
      var data = null;
      if (previewToken) {
        var r = await fetch('/api/cms/draft?preview=' + encodeURIComponent(previewToken));
        if (!r.ok) { failBadge('This preview has expired. Open a new preview from the Website Manager.'); return; }
        var rawR = await r.json();
        activeRawDraft = rawR;
        data = normalizeDraft(rawR);
      } else if (previewLegacy || clerkToken) {
        var t = clerkToken;
        if (!t) { try { t = sessionStorage.getItem('revolvyn_preview_token'); } catch (e) {} }
        if (!t) return;
        var r2 = await fetch('/api/cms/draft', { headers: { Authorization: 'Bearer ' + t } });
        if (!r2.ok) return;
        var rawR2 = await r2.json();
        activeRawDraft = rawR2;
        data = normalizeDraft(rawR2);
      } else return;
      apply(data);
      positionPills();
      if (!silent) previewToast('Preview updated ✓');
      else previewToast('Preview updated ✓');
    } catch (e) {}
  }

  window.REVOLVYN_GUI_EDITOR = {
    activate: activateSiteEditor,
    exit: exitEditMode
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
