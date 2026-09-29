# FINAL_SEO_REPORT.md — 25k-Keyword Project, Iteration 1 (2026-09-29)

## 1. What was changed (this iteration)

Strategy docs (new, `seo/`): PROJECT_SEO_BASELINE, KEYWORD_MASTER_ANALYSIS, KEYWORD_CLUSTERS, FULL_SEO_AUDIT (score 71/100), KEYWORD_GAP_ANALYSIS, KEYWORD_TO_PAGE_MAP, INTERNAL_LINKING_PLAN, SEO_CHANGELOG (baseline).
Code: brands.html hero depth (160→284 words, category proof + 4 contextual links), contact.html depth (320→382, consultative intro + service-area lines), sitemap.xml lastmod refresh for 5 changed URLs. Zero CSS/JS touched (verified via diff).

## 2. Existing pages optimized

Home (geo meta, 10 FAQs, unified schema — prior), services (hero keywords, 10 FAQs + matched schema — prior), portfolio (FAQ block — prior), contact (FAQ + depth — prior + this), brands (depth + links — this). 404/video/inspo/manage quarantines (prior).

## 3. New pages created

None — deliberately. No new page met the justification bar yet (see §12).

## 4. Keyword clusters implemented

12 clusters validated: 7 KEEP (brand, generics, performance/paid-social, SEO, social, influencer+YouTube-merged, content/video+creative-merged), 1 SPLIT (paid ads: social keep / search drop), 1 content-layer (investigation queries → FAQs/articles), 1 backlog (990 info rows → 4 briefed articles), 1 local (Kolkata/WB/India keep, 20+ cities drop), plus explicit non-targets (google-ads/ppc, branding-identity, YT-management).

## 5. Important keywords mapped

170 primaries → 9 map nodes (M1–M9 + backlog M10 + non-targets M11). One-intent-per-page enforced; cannibalization rules documented (home=brand/generics; anchors own heads; portfolio owns proof; contact owns local).

## 6. Technical issues fixed

Prior iteration: robots (AI-bots, inspo block), HSTS + static caching, 404 canonical, alt/attribute fixes, schema @id unification, feed freshness. This iteration: sitemap lastmod accuracy. Residual: www-redirect unverified (hosting-level), field CWV unmeasured (needs GSC/CrUX).

## 7. Schema implemented

Unified graph (Organization#business ↔ WebSite#website ↔ ProfessionalService), OfferCatalog(8), ItemList(34 VideoObject), 2× matched FAQPage(10). Validated JSON. No fabricated entities; FAQPage kept for content/AI value with no SERP-benefit claim (retired May 2026).

## 8. Image SEO

Lazy/async + descriptive alts sitewide; WebP client logos; OG 1200×630+alt. Residual (low): favicon PNG 33KB diet, logo srcset.

## 9. Internal linking

Hub-spoke live: 8 home cards, 14 contextual FAQ links (services), 6 (index), 6 (portfolio), 4+ (contact), 4 (brands); footer net complete; 3-link rule mandated for future articles; exact-match discipline enforced.

## 10. Local SEO

NAP byte-consistent (contact schema + visible + footer + llms.txt); hours; Kolkata/WB/India signals; GBP/reviews/citations = off-site next step (not code).

## 11. AI-search readiness

llms.txt (services block + key pages), AI-bot allows (7 crawlers), entity graph, self-contained FAQ answers, fresh feed. Gap: article depth + author attribution.

## 12. Remaining issues & next iteration

1. 3–4 articles (M10 briefs → write at 1200+ words, needs article template on flat host).
2. Top-3 anchor depth to 1000+ words each (copywriting pass, existing components).
3. Field CWV measurement → defer Three.js boot if INP poor (perf budget guarded).
4. GBP + reviews + backlinks (off-site).
5. Revisit `/services/*` split ONLY on GSC evidence of anchor-indexing limits.

## 13. Honest visibility forecast (no fabrication)

Tier-1 (branded + Kolkata long-tail): Top-10 realistic in 4–12 weeks post-indexing. Tier-2 (mid commercial): 3–6 months with articles + authority. Tier-3 (national heads): not winnable on code/content alone. "Sab keywords top" is not possible for any site; ~7.4k universe rows are deliberate non-targets. GSC data needed to refine: queries, impressions, CTR, positions, coverage, CWV.
