# PROJECT_SEO_BASELINE.md — Revolvyn Website SEO Baseline

Date: 2026-09-29. Domain: https://revolvynmedia.com (canonical). Commit: 428c5cc.

## 1. Framework & rendering

- No framework. Hand-written static multi-page site (`.html` files at root, shared `css/`, `js/`).
- No SSR/SSG pipeline. Hosting: Vercel (static + serverless `api/` for Owner CMS).
- Routing: flat files (`/services.html`, `/portfolio.html`, …) + Vercel rewrite `/manage → manage.html`.
- JS rendering risk: homepage boots a Three.js WebGPU scene (`js/three-scene.js` 53.9KB + `main.js`) via `await initRenderer()` / `await bootScene()` before hiding loader. Content below still server-sent HTML (good), but INP/LCP risk on low-end mobile.
- CMS: Owner-only (`manage.html` + `api/`, Neon + Clerk), correctly `noindex` + `no-store` + robots-disallowed.

## 2. Page inventory (public, indexable)

| URL | Words (visible) | H1 | Schema | Notes |
|---|---|---|---|---|
| `/` (index.html) | 764 | 1 | WebPage+Breadcrumb, Organization(@id #business), WebSite(@id #website), FAQPage(10) | Money page. Geo meta present. |
| `/services.html` | 916 | 1 | WebPage+Breadcrumb, Organization, ProfessionalService+OfferCatalog(8), FAQPage(10) | Money page. 8 service anchors. |
| `/portfolio.html` | 418 | 1 | WebPage+Breadcrumb, Organization, ItemList(34 VideoObject) | Proof page. New FAQ block (5). |
| `/brands.html` | 160 | 1 | WebPage+Breadcrumb, Organization | THIN. Brand logo grid, lazy+async. |
| `/contact.html` | 320 | 1 | WebPage+Breadcrumb, ProfessionalService(#business NAP+hours), Organization | Local signals present. New FAQ (4). |
| `/blog.html` | 244 | 1 | WebPage+Breadcrumb, Organization | Placeholder ("Coming Soon"). THIN. |
| `/research.html` | 289 | 1 | WebPage+Breadcrumb, Organization | Generic statements. THIN. |
| `/community.html` | 222 | 1 | WebPage+Breadcrumb, Organization | THIN. |
| `/newsletter.html` | 257 | 1 | WebPage+Breadcrumb, Organization | THIN. |
| `/partnerships.html` | 269 | 1 | WebPage+Breadcrumb, Organization | THIN. |
| `/careers.html` | 288 | 1 | WebPage+Breadcrumb, Organization | THIN. |
| `/privacy.html` | 379 | 1 | WebPage+Breadcrumb, Organization | Fine. |
| `/refund.html` | 350 | 1 | WebPage+Breadcrumb, Organization | Fine. |
| `/404.html` | 40 | 1 | none (+noindex) | Canonical → home (fixed). |
| `/video.html` | 86 | 1 | none (+noindex) | App-like player, query params. Correctly excluded. |
| `/inspo/` | demo | 1 | none (+noindex+nofollow, robots-disallow, HSTS-style no-store) | Demo, correctly quarantined. |

Word counts = visible text minus script/style. Money pagesшла 764/916 (acceptable, target 1000+). Support pages 160–320 (thin for competitive intents).

## 3. Current SEO architecture

- Canonical: absolute, consistent `https://revolvynmedia.com/*` on all pages. Hreflang `en` + `x-default` self-referencing per page.
- Metadata: unique title+description per page; OG complete (type, site_name, title, desc, url, image 1200×630 + alt); Twitter summary_large_image; `robots` index/follow with max-preview directives; theme-color; RSS alternate.
- Sitemap: `/sitemap.xml`, 13 URLs, priorities 0.2–1.0, lastmod 2026-09-16, image extensions on money pages. Excludes noindex pages (correct).
- Robots: `*` allow + disallow `/manage*`, `/api/`, `/inspo*`, `?brand=`, `?autoplay=`; per-engine sections (Bing/msn/DuckDuck/Slurp/Yandex/Apple/Brave) with crawl-delay; explicit AI-crawler allows (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, PerplexityBot, Applebot-Extended); social preview bots allowed.
- Structured data: unified graph on home (`Organization #business` ↔ `WebSite #website` ↔ `ProfessionalService #business` on contact/services). `OfferCatalog` (8 services) on services.html. `ItemList` of 34 `VideoObject` on portfolio. `FAQPage` on home (10) + services (10) matching visible FAQs. NOTE: FAQ rich results retired by Google (May 2026) — kept for content/AI value, no SERP-benefit claim.
- Images: brand logos `loading=lazy decoding=async` + alt; client logos WebP; OG 37.5KB; favicon PNG 33KB + SVG alternative.
- Internal linking: footer link graph all pages; homepage `seo-grid` (8 service-anchor cards); contextual links inside new FAQ answers; noscript fallbacks with links (portfolio list, video page).
- Analytics: GA4 `G-1Y8TZD3QD3` on all public pages. No Search Console API connection in this environment (manual GSC work required).
- Feeds/AI: `feed.xml` (fresh 2026-09-29), `llms.txt` with service keyword block, `site.webmanifest`, `browserconfig.xml`.
- Headers (vercel.json): nosniff, SAMEORIGIN, strict referrer, permissions-policy, HSTS preload; static caching (logos immutable, css/js/images 86400+swr); no-store on manage/cms/api; X-Robots-Tag noindex on `/video.html`, `/manage*`, `/inspo/*`.

## 4. Current problems (ranked)

1. **Thin support pages** (160–320 words) — brands/blog/research/community/newsletter/partnerships/careers cannot compete for their head terms.
2. **Blog is a placeholder** — zero informational topical authority; 330 informational + 660 info/commercial keywords have no home.
3. **No dedicated service URLs** — one `services.html` with anchors carries 8 services (~23k commercial keywords map to 8 anchors). Works, but per-service depth is capped.
4. **Heavy homepage JS** — Three.js boot blocks loader hide; INP risk (unmeasured — no CrUX/GSC here).
5. **No GBP/reviews/citations program** — local pack invisible (off-site, not code).
6. **No backlink program** — authority gap vs national competitors (off-site).
7. **Keyword universe mismatch** — ~686 google-ads/ppc keywords describe a service not offered; ~6.7k non-Kolkata city keywords describe locations with no presence; ~24 industry×city combos each need proof to be credible.

## 5. Recommendations (phased)

- P0 (done): technical hardening, schema unification, FAQ depth on money pages, geo meta, AI-crawler access.
- P1: keyword→page map honoring one-intent-per-page; internal-link plan; 3–4 informational articles for real queries (meta-ads cost, SEO timelines, influencer process, AI UGC).
- P2: per-service depth on services.html anchors; portfolio case-study structure (no invented metrics); GBP + reviews; backlink outreach.
- Explicitly NOT recommended: /services/* directory split (yet), city pages beyond Kolkata/WB/India, google-ads/ppc targeting, mass article generation.
