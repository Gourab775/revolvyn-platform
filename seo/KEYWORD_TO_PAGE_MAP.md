# KEYWORD_TO_PAGE_MAP.md — Definitive Keyword → Page Architecture

Convention: one row = one intent = one URL. `services.html#x` anchors are first-class targets (flat site, no directory split this iteration). Titles/metas below are the CURRENT live values unless marked [PROPOSED].

## M1. Brand → `/` (existing)

- Primary: `revolvyn`, `revolvyn media agency`, `revolvyn kolkata`. Secondary: 40 brand+service navigational rows.
- H1 (live): `REVOLVYN — Digital Marketing, Influencer & Video Ads Agency in India` (sr-only geo tail). Title (live): `REVOLVYN | Digital Marketing, Influencer & Video Ads Agency`. Meta: geo + proof + CTA (live).
- Schema: WebPage+Breadcrumb, Organization#business, WebSite#website, FAQPage(10). Images: OG 1200×630 + alt.
- Links in: footer (all pages), brand mentions. Links out: 8 service cards, portfolio, contact, blog/research.

## M2. Digital generics + geo → `/` + `/contact.html` (existing)

- Primary: `digital marketing agency (kolkata/india)`, `growth marketing agency`. Secondary: modifier/industry Kolkata rows.
- H1 home `What we do / Full-stack growth…` (h2, correct — brand H1 stays). Contact H1 `Let's Talk` + NAP stays.
- [PROPOSED — low risk]: contact page-hero sub already keyword-rich; expand contact to ~600 words with service-area + process lines (same components).

## M3. Performance/paid-social → `/services.html#performance-marketing` (existing)

- Primary: `performance marketing agency`, `meta ads agency (kolkata/india)`, `paid social agency`, `retargeting agency`, `lead generation agency (via Meta)`.
- Secondary: industry/modifier permutations → answered in FAQ + proof lines, never pages.
- H1 (page): `Digital Marketing Services for Growth-Stage Brands` (umbrella — correct, anchors carry specifics via h3/h4).
- Schema: OfferCatalog Offer → Service#performance-marketing (live). FAQPage covers cost/timeline/process (live).
- Links: home card, index FAQ answers, portfolio CTA, contact form service option.

## M4. SEO → `/services.html#website-seo` (existing)

- Primary: `seo agency (kolkata)`, `seo services india`, `website + seo`, `technical seo services`.
- Secondary: `seo for d2c/ecommerce/startups` → FAQ/proof mentions.
- Title (page, live): `Growth Services: Ads, SEO, Content & Creators | REVOLVYN` — umbrella title retained deliberately (splitting titles per anchor is impossible on one URL; cannibalization avoided by design).

## M5. Social → `/services.html#social-media` (existing)

- Primary: `social media marketing agency`, `social media management (kolkata)`, `instagram marketing agency`.
- Paid-social overlap rows → canonical answer lives at M3; here one cross-link line only.

## M6. Influencer/creator (+YouTube merged) → `/services.html#influencer-marketing` (existing)

- Primary: `influencer marketing agency`, `creator marketing agency`, `youtube influencer agency`, `ugc creator agency (+kolkata/india)`.
- Proof lines (live): 110+ YouTubers, 20 videos/month. Deepest anchor — flagship differentiator.

## M7. Content/video → `/services.html#content-production` + `/portfolio.html` (existing)

- Primary: `content creation agency`, `video production agency (kolkata)`, `ad film production`, `ugc video production`.
- Portfolio owns: brand-name + `ad films/portfolio` queries (noscript list + 34 VideoObjects + FAQ).
- Creative-advertising rows (2655) resolve here — no separate page, ever (same intent: "make my ads").

## M8. Growth consulting/bundle → `/services.html#growth-consulting` + `#bundle` (existing)

- Primary: `growth consultant`, `full-service digital marketing`, `ads + content + seo bundle`.
- Consultative/long-cycle intent; CTA = free consultation (contact).

## M9. Proof/comparison (`benefits/top/best`, brand names) → `/portfolio.html`, `/brands.html`, FAQs (existing)

- No self-ranking listicles. `brands.html` owns "brands we've scaled" (expand 160→500 words with category lines — approved).

## M10. Informational (990 rows) → FUTURE articles (template pending, briefs first)

| Article (proposed slug) | Primary query | Links to |
|---|---|---|
| `/blog/meta-ads-cost-india.html` | how much do meta ads cost in india | #performance-marketing, portfolio, contact |
| `/blog/seo-timeline.html` | how long does seo take | #website-seo, contact |
| `/blog/influencer-campaign-process.html` | how influencer marketing works / cost | #influencer-marketing, brands, contact |
| `/blog/ai-ugc-vs-real-ugc.html` | ai ugc vs real ugc | #ai-content, portfolio, contact |

Each: 1200+ words, unique H1, Article schema, author = REVOLVYN team (no fake persons), CTA. Write only when ready to publish at depth — no stubs.

## M11. Explicit non-targets (owned by nobody)

google-ads/ppc/paid-search management; 20+ non-Kolkata cities; brand-identity service; standalone YouTube management; standalone local-SEO product. Rationale in KEYWORD_MASTER_ANALYSIS §4.
