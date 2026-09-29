# KEYWORD_CLUSTERS.md — Validated Topical Architecture

Rule applied: one cluster = one dominant intent = one page. Clusters validated against what Revolvyn actually sells (8 offers on services.html). Verdicts: KEEP (target), MERGE (fold into another page), DROP (do not target, reason given).

## C1. Brand — KEEP → `/` (existing)

- Seed/primary: `revolvyn`, `revolvyn media agency`, `revolvyn kolkata` (44 rows, Navigational).
- Secondaries: brand+service combos (`revolvyn meta ads`, `revolvyn seo strategy`…). Covered by home FAQ + service cards.
- Cannibalization risk: none (only home claims the brand).

## C2. Digital Marketing (generics) — KEEP → `/` (existing)

- Primary: `digital marketing agency`, `digital marketing services`, `growth marketing agency` (+ Kolkata/India modifiers).
- Intent: Commercial/Local Commercial. Home owns generics; services.html must NOT chase the same head (would cannibalize home).
- Content: home seo-overview + geo meta (done). Kolkata rows → home+contact NAP; other-city rows → DROP.

## C3. Performance Marketing — KEEP → `/services.html#performance-marketing` (existing anchor)

- Primary: `performance marketing agency`, `performance marketing services`, `meta ads agency`, `paid social agency`, `retargeting agency` (+ Kolkata/India only).
- Secondaries: modifier × industry permutations (~2.7k). Industry rows are credible ONLY as FAQ/proof mentions (320+ brands, D2C/tech/lifestyle), never as pages.
- DROP rows: google-ads/paid-search/ppc-management variants inside this file region.

## C4. Paid Ads — SPLIT: KEEP (paid-social) / DROP (search)

- KEEP → same anchor as C3 (`#performance-marketing`): `paid social agency`, `instagram ads agency`, `meta advertising`, `retargeting/remarketing`, `lead generation agency` (lead-gen via Meta is sold).
- DROP: `google ads agency/services`, `ppc agency/services`, `paid search agency` (~686+ rows) — service not offered. Listing them would be a false claim and attract wrong-intent traffic.
- Cannibalization: C3 and C4-keep share one anchor by design (same intent: "run my paid social"). Do NOT split into two pages.

## C5. SEO — KEEP → `/services.html#website-seo` (existing anchor)

- Primary: `seo agency`, `seo services`, `website + seo`, `technical seo` (+ Kolkata/India).
- Secondaries: `seo for d2c/ecommerce/startups` → FAQ answers, not pages.
- `local seo` rows → home/contact geo signals only (no local-seo product page; agency does SEO, not a local-SEO SaaS).
- New-page test: a standalone `/seo.html` is NOT justified yet — anchor depth (FAQ 10, OfferCatalog) suffices until organic traction proves demand.

## C6. Social Media Marketing — KEEP → `/services.html#social-media` (existing anchor)

- Primary: `social media marketing agency`, `social media management`, `instagram marketing` (+ Kolkata/India).
- Paid-social overlap (`paid social media agency`) → canonicalize to C3 anchor; mention here with a cross-link, never duplicate the answer.

## C7. Influencer + Creator (+ YouTube merged) — KEEP → `/services.html#influencer-marketing` (existing anchor)

- Primary: `influencer marketing agency`, `creator marketing`, `youtube influencer agency`, `ugc creator agency` (+ Kolkata/India).
- Proof: 110+ YouTubers, 20 creator videos/month — strongest differentiator; this anchor deserves the deepest content.
- MERGED: YouTube cluster (1211 rows) — no YouTube-ads/management service exists, so YouTube rows live here as creator-network proof, not as a page.

## C8. Content Marketing + Video Production (merged) — KEEP → `/services.html#content-production` + `/portfolio.html` (existing)

- Primary: `content creation agency`, `video production agency`, `ad film production`, `ugc video production` (+ Kolkata/India).
- MERGED: Creative Advertising cluster (2655) — production + portfolio ARE the answer; no `creative-agency` page.
- Portfolio ItemList (34 VideoObject) is the proof asset; internal-link services ↔ portfolio both ways.

## C9. Branding — DROP as service page (portfolio answers incidentally)

- 2291 rows (`brand identity agency`, `brand strategy agency`…). No identity/strategy product is sold. A branding page would be thin and dishonest.
- Incidental coverage via portfolio (brand films) + home is enough. Revisit only if a real branding offer launches.

## C10. Commercial Investigation (`benefits/top/best`, 1966 rows) — KEEP as content layer, no new pages

- Answer inside existing FAQs + future articles (e.g. "benefits of influencer marketing" → services FAQ; "top meta ads agency kolkata" → never a self-listicle; portfolio proof instead).

## C11. Informational (330) + Info/Commercial (660) — KEEP as article backlog, NOT pages yet

- Genuine article candidates (each needs a content-brief first): meta-ads cost India; how long SEO takes; influencer campaign process; AI UGC vs real UGC; retargeting setup; D2C creative testing.
- `blog.html` is currently a placeholder — articles go here ONLY when written to full depth (1200+ words), never as stubs.

## C12. Local — KEEP Kolkata/WB/India, DROP everything else

- Keep: `in kolkata`, `kolkata india`, `west bengal`, `in india`, `near me` (→ home/contact/GBP).
- Drop: ~6.7k rows for 20+ other cities (Mumbai, Delhi, Bangalore…). No presence, no proof → fake-local risk. Documented, not targeted.

## Cannibalization map (enforced)

- Home owns: brand + digital-marketing generics.
- services.html#performance-marketing owns: performance + paid-social + retargeting + lead-gen(via Meta).
- #website-seo, #social-media, #influencer-marketing, #content-production own their heads.
- Portfolio owns proof queries (brand names + "ad films/portfolio").
- Contact owns local/navigational ("where", "call", "consultation").
- google-ads/ppc, non-Kolkata cities, branding-identity: owned by NOBODY (deliberate).
