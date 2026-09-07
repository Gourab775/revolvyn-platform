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
  function setVideo(video, v, lazy) {
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

  async function load() {
    var preview = /(?:\?|&)cms_preview=draft/.test(window.location.search);
    var data = null;
    try {
      if (preview) {
        var t = null;
        try { t = sessionStorage.getItem('revolvyn_preview_token'); } catch (e) {}
        if (!t) return;
        var r = await fetch('/api/cms/draft', { headers: { Authorization: 'Bearer ' + t } });
        if (!r.ok) return;
        data = normalizeDraft(await r.json());
        badge();
      } else {
        var res = await fetch('/api/public/content');
        if (!res.ok) return;
        var j = await res.json();
        if (!j.published || !j.content) return;
        data = j.content;
      }
    } catch (e) { return; }
    try { apply(data); } catch (e) { /* never break the public page */ }
  }

  function normalizeDraft(d) {
    return {
      sections: (d.sections || []).map(function (s) {
        return { page: s.page_slug, key: s.section_key, data: s.data || {}, visible: s.is_visible, order: s.sort_order };
      }),
      portfolio: (d.portfolio || []).map(function (p) {
        return { title: p.title, description: p.description, thumbnail: p.thumbnail, video: p.video_url, url: p.external_url, client: p.client_name, category: p.category, layout: p.layout || 'landscape', visible: p.is_visible, order: p.sort_order };
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
    var s = data.settings || {};
    var path = window.location.pathname;
    var page = 'index';
    if (/portfolio\.html/.test(path)) page = 'portfolio';
    else if (/brands\.html/.test(path)) page = 'brands';
    else if (/services\.html/.test(path)) page = 'services';
    else if (/contact\.html/.test(path)) page = 'contact';
    else if (/careers\.html/.test(path)) page = 'careers';
    else if (/partnerships\.html/.test(path)) page = 'partnerships';
    else if (/blog\.html/.test(path)) page = 'blog';
    else if (/research\.html/.test(path)) page = 'research';
    else if (/newsletter\.html/.test(path)) page = 'newsletter';
    else if (/community\.html/.test(path)) page = 'community';
    else if (/privacy\.html/.test(path)) page = 'privacy';
    else if (/refund\.html/.test(path)) page = 'refund';
    var isHome = page === 'index' && !!document.getElementById('scroll-container');

    if (isHome) applyHome(data);
    else if (page === 'portfolio') applyPortfolio(data);
    else if (page === 'brands') applyBrands(data);
    else if (page === 'services') applyServices(data);
    else if (page === 'contact') applyContact(data, s);
    else if (page !== 'index') applySecondary(data, page);
    applyFooter(s);
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
    // Homepage strip: first 6 visible published projects
    var vids = (data.portfolio || []).filter(function (p) { return p.visible !== false && p.video; }).slice(0, 6);
    var slots = document.querySelectorAll('.portfolio-item');
    if (vids.length && slots.length) {
      for (var i = 0; i < slots.length; i++) {
        var v = slots[i].querySelector('video');
        if (vids[i]) {
          slots[i].style.display = '';
          if (v) setVideo(v, vids[i].video, i >= 3);
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
      '&orient=' + encodeURIComponent(p.layout === 'portrait' ? 'portrait' : 'landscape') +
      '&index=' + i;
  }
  function applyPortfolio(data) {
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
    var grid = document.getElementById('collageGrid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(function (p, i) {
      var item = document.createElement('div');
      item.className = 'collage-item ' + (p.layout === 'portrait' ? 'portrait' : 'landscape') + ' revealed';
      item.setAttribute('data-order', String(i + 1));
      item.onclick = (function (pp, ii) {
        return function () { window.location.href = 'video.html?' + projectParams(pp, ii) + '&autoplay=1'; };
      })(p, i);
      var video = document.createElement('video');
      video.muted = true; video.loop = true; video.playsInline = true;
      video.preload = i < 6 ? 'auto' : 'none';
      if (i < 6 && p.video) video.setAttribute('src', p.video);
      else if (p.video) video.dataset.src = p.video;
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
      if (!key || !links[key]) return;
      col.querySelectorAll('a').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        for (var i = 0; i < links[key].length; i++) {
          if (links[key][i].url === href) {
            if (links[key][i].label) a.textContent = links[key][i].label;
            break;
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
