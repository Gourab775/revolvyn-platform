# SEO_CHANGELOG.md — Measurable Baseline & Change Log

No GSC API in this environment; this file is the manual drift baseline. Re-run word-count + diff commands below to compare.

## Baseline 2026-09-29 (commit 428c5cc + this iteration)

Visible words per page: index 764, services 916, portfolio 418, brands 160→~300 (after edit), contact 320→~480 (after edit), blog 244, research 289, community 222, newsletter 257, partnerships 269, careers 288, privacy 379, refund 350.
Sitemap lastmod: 2026-09-29 for /, services, portfolio, brands, contact; 2026-09-16 others.

## Changes

| Date | Change | Pages | Reason (cluster) | Expected effect | Observed |
|---|---|---|---|---|---|
| 2026-09-29 | Tech hardening: robots AI-bots/inspo, HSTS+cache, canonical/alt, schema @id, feed date | 8 files | crawl/index/GEO | index coverage, speed, entity graph | verify in GSC Coverage + PageSpeed |
| 2026-09-29 | FAQ 4→10 services, 6→10 home, +5 portfolio, +4 contact; geo meta; llms keywords | index/services/portfolio/contact/llms | M1–M8 mapping | long-tail capture, internal-link flow | GSC queries/impressions in 4 wks |
| 2026-09-29 | Keyword architecture docs (7 files in seo/) | seo/ | 25k universe → 12 validated clusters | one-intent-per-page, no cannibalization | — |
| 2026-09-29 | brands hero depth + 4 links; contact depth + NAP area lines; sitemap lastmod | brands/contact/sitemap | M9 proof, M2 local | brands/contact long-tail | GSC positions 6–8 wks |

## How to re-measure

- Words: `Get-ChildItem -Filter *.html | % {…}` (see FINAL_SEO_REPORT).
- Schema: python JSON check on ld+json blocks.
- Rankings: GSC Performance (queries, impressions, CTR, position) — manual; do not fabricate.
