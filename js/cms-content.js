/* REVOLVYN CMS — public hydrator. Applies PUBLISHED content only.
 * If no published snapshot exists (or the API is unreachable), this script
 * does nothing and the page keeps its built-in copy — visually identical.
 * Draft preview: /manage opens pages with ?cms_preview=draft and stores a
 * short-lived Clerk token in sessionStorage; only then do we read drafts. */
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
  function setVideo(video, v) {
    if (!video || !v) return;
    if (video.getAttribute('src') !== v && video.dataset.src !== v) {
      video.setAttribute('src', v);
      try { video.load(); } catch (e) {}
    }
  }
  function setting(s, k) {
    var v = s ? s[k] : null;
    return typeof v === 'string' ? v : v == null ? '' : String(v);
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
        var d = await r.json();
        data = normalizeDraft(d);
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
    var secs = (d.sections || []).map(function (s) {
      return { page: s.page_slug, key: s.section_key, data: s.data || {}, visible: s.is_visible, order: s.sort_order };
    });
    return {
      sections: secs,
      portfolio: (d.portfolio || []).map(function (p) {
        return { title: p.title, description: p.description, thumbnail: p.thumbnail, video: p.video_url, url: p.external_url, visible: p.is_visible, order: p.sort_order };
      }),
      brands: (d.brands || []).map(function (b) {
        return { name: b.name, logo: b.logo, url: b.website_url, visible: b.is_visible, order: b.sort_order };
      }),
      services: (d.services || []).map(function (s) {
        return { title: s.title, description: s.description, image: s.image, visible: s.is_visible, order: s.sort_order };
      }),
      settings: Object.fromEntries((d.settings || []).map(function (s) {
        return [s.key, typeof s.value === 'string' ? s.value : ''];
      }))
    };
  }

  function badge() {
    var b = document.createElement('div');
    b.textContent = 'Draft preview — visitors see the published site';
    b.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#d9ec7a;color:#1a220c;font:600 12px Inter,system-ui,sans-serif;padding:8px 16px;border-radius:999px;z-index:99999;';
    document.body.appendChild(b);
  }

  function section(data, page, key) {
    var s = (data.sections || []).filter(function (x) { return x.page === page && x.key === key; })[0];
    return s ? s.data : null;
  }

  function apply(data) {
    var s = data.settings || {};
    var isHome = !!document.getElementById('scroll-container');
    var path = window.location.pathname;

    // Home sections
    if (isHome) {
      var hero = section(data, 'home', 'hero');
      if (hero) {
        setText(document.querySelector('.hero-tag'), hero.tag);
        setText(document.querySelector('.hero h1'), hero.heading);
        setText(document.querySelector('.hero-sub'), hero.description);
      }
      var man = section(data, 'home', 'manifesto');
      if (man) {
        setText(document.querySelector('.manifesto-label'), man.label);
        setText(document.querySelector('.manifesto h2'), man.heading);
      }
      var q = section(data, 'home', 'quote');
      if (q) {
        setText(document.querySelector('.quote-section blockquote'), q.quote);
        setText(document.querySelector('.quote-attr'), q.attribution);
      }
      var cta = section(data, 'home', 'cta');
      if (cta) {
        var h2 = document.querySelector('.cta-section h2');
        if (h2 && cta.heading) h2.textContent = cta.heading;
        var btn = document.querySelector('.cta-section .cta-btn');
        if (btn) {
          if (cta.buttonText) btn.textContent = cta.buttonText;
          if (cta.buttonUrl) btn.setAttribute('href', cta.buttonUrl);
        }
      }
      // Home portfolio strip (first 6 visible videos)
      var vids = (data.portfolio || []).filter(function (p) { return p.visible !== false && p.video; }).slice(0, 6);
      var slots = document.querySelectorAll('.portfolio-item video');
      if (vids.length && slots.length) {
        for (var i = 0; i < slots.length; i++) {
          if (vids[i]) setVideo(slots[i], vids[i].video);
          else slots[i].closest('.portfolio-item').style.display = 'none';
        }
      }
      // Home brand marquee (first 5 visible)
      var hb = (data.brands || []).filter(function (b) { return b.visible !== false && b.logo; }).slice(0, 5);
      var himgs = document.querySelectorAll('.brand-logo-item img');
      if (hb.length >= 5 && himgs.length >= 10) {
        for (var j = 0; j < 10; j++) {
          var src = hb[j % 5];
          setSrc(himgs[j], src.logo);
          himgs[j].setAttribute('alt', src.name || himgs[j].getAttribute('alt'));
        }
      }
    }

    // Portfolio page collage
    if (/portfolio\.html/.test(path)) {
      var items = (data.portfolio || []).filter(function (p) { return p.visible !== false; });
      var cells = document.querySelectorAll('.collage-item');
      if (items.length && cells.length) {
        for (var k = 0; k < cells.length; k++) {
          var cell = cells[k];
          if (k < items.length) {
            cell.style.display = '';
            var v = cell.querySelector('video');
            if (v && items[k].video) setVideo(v, items[k].video);
            var im = cell.querySelector('img');
            if (im && items[k].thumbnail) setSrc(im, items[k].thumbnail);
            if (items[k].url) cell.setAttribute('data-href', items[k].url);
          } else cell.style.display = 'none';
        }
      }
    }

    // Brands page grid
    if (/brands\.html/.test(path)) {
      var bl = (data.brands || []).filter(function (b) { return b.visible !== false; });
      var cards = document.querySelectorAll('.brand-card');
      if (bl.length && cards.length) {
        for (var m = 0; m < cards.length; m++) {
          if (m < bl.length) {
            cards[m].style.display = '';
            setSrc(cards[m].querySelector('img'), bl[m].logo);
            var nm = cards[m].querySelector('.brand-card-name');
            setText(nm, bl[m].name);
            var im2 = cards[m].querySelector('img');
            if (im2 && bl[m].name) im2.setAttribute('alt', bl[m].name);
          } else cards[m].style.display = 'none';
        }
      }
    }

    // Services page
    if (/services\.html/.test(path)) {
      var sv = (data.services || []).filter(function (x) { return x.visible !== false; });
      var scards = document.querySelectorAll('.service-full-card');
      if (sv.length && scards.length) {
        for (var n = 0; n < scards.length; n++) {
          if (n < sv.length) {
            scards[n].style.display = '';
            setText(scards[n].querySelector('h3'), sv[n].title);
            var desc = scards[n].querySelector(':scope > p');
            if (desc && sv[n].description) desc.textContent = sv[n].description;
          } else scards[n].style.display = 'none';
        }
      }
    }

    // Contact page details
    if (/contact\.html/.test(path)) {
      var map = [
        ['Email', setting(s, 'contact.email')], ['Phone', setting(s, 'contact.phone')],
        ['Office', setting(s, 'contact.office')], ['Hours', setting(s, 'contact.hours')]
      ];
      document.querySelectorAll('.contact-detail').forEach(function (row) {
        var lab = row.querySelector('.contact-detail-label');
        var txt = row.querySelector('.contact-detail-text');
        if (!lab || !txt) return;
        map.forEach(function (pair) {
          if (lab.textContent.trim() === pair[0] && pair[1]) txt.textContent = pair[1];
        });
      });
    }

    // Footer everywhere
    var tag = setting(s, 'footer.tagline');
    if (tag) document.querySelectorAll('.sf-brand-desc').forEach(function (el) { el.textContent = tag; });
    var copy = setting(s, 'footer.copyright');
    if (copy) document.querySelectorAll('.sf-copy').forEach(function (el) { el.textContent = copy; });
    var soc = { Instagram: setting(s, 'social.instagram'), Facebook: setting(s, 'social.facebook'), YouTube: setting(s, 'social.youtube') };
    document.querySelectorAll('.sf-socials a').forEach(function (a) {
      var t = a.textContent.trim();
      if (soc[t]) a.setAttribute('href', soc[t]);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
