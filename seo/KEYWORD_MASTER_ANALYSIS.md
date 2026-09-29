# KEYWORD_MASTER_ANALYSIS.md — 25,055-Keyword Universe

Source: `C:\revolvynmedia_keywords\Revolvyn_Max_Keyword_Universe.xlsx` (primary) + `Revolvyn_Keyword_List.txt` (reference copy, same 12 categories). Date: 2026-09-29.

## 1. File facts (measured, not estimated)

- 25,055 unique keywords, 0 exact duplicates. Schema: Keyword | Cluster | Intent | Suggested Page | Priority | Type.
- 12 clusters: SEO 2933, Social Media 2866, Performance Marketing 2768, Paid Ads 2727, Creative Advertising 2655, Content Marketing 2321, Branding 2291, Influencer Marketing 2146, Digital Marketing 1779, Video Production 1314, YouTube 1211, Brand 44.
- Intent: Local Commercial 11956 (47.7%), Commercial 10099 (40.3%), Commercial Investigation 1966 (7.8%), Informational/Commercial 660 (2.6%), Informational 330 (1.3%), Navigational* 44 (0.2%).
- Priority: Primary 170 (44 Brand + 126 Core service heads), Secondary 23565, Long-tail 1320.
- Type: Industry 8527, Local 8062, Local Industry 3894, Modifier 1636, Long-tail 1386, Informational 1320, Core 186, Brand 44.
- No search volume / difficulty / CPC in file (intentionally — requires keyword-tool data; nothing fabricated here).

## 2. How the universe is built (pattern)

Combinatorial expansion: `{modifier} × {service} × {for industry} × {in city}`. Evidence:
- 15,611 keyword instances contain a city token. Kolkata 8902 (home base, expected); ~24 other Indian cities × ~278 each (Mumbai, Delhi, Bangalore/Bengaluru, Chennai, Hyderabad, Pune, Ahmedabad, Jaipur, Surat, Lucknow, Patna, Noida, Goa, Gurgaon/Gurugram, Indore, Kochi/Coimbatore regionals, Bhubaneswar, Guwahati, Ranchi, Chandigarh, Kerala, Calcutta alias, West Bengal, Delhi NCR).
- Industry slots (~30: automotive, b2b, beauty, d2c, ecommerce, edtech, fashion, fintech, healthcare, hospitality, real estate, restaurant, retail, saas, …) repeat per service and per city.
- Modifier slots (premium, professional, trusted, top, reliable, result-driven, …) repeat per service.

Consequence: only a small fraction are distinct intents. ~23.5k "Secondary" rows are near-duplicate permutations of ~126 core + ~44 brand heads. This is a research database, NOT a page list.

## 3. Intent reading

- 88% Commercial / Local Commercial → the universe is built to find service pages, not to inform. Only 330 pure Informational + 660 Info/Commercial rows feed articles.
- 1966 Commercial Investigation (`benefits of X`, `top`, `best`, comparisons) → comparison/proof content + portfolio, not service pages.
- Brand 44 → navigational, home only. No conflict.

## 4. Business-fit flags (critical)

1. **Google Ads / PPC (~686 rows inside Paid Ads):** Revolvyn sells Meta (paid-social) + retargeting, NOT Google Ads/paid-search management. Targeting `google ads agency / ppc services` would be a false claim. Verdict: DO NOT target; keep Meta/paid-social/retargeting rows only.
2. **Non-Kolkata cities (~6,700 rows):** no offices, no staff, no case proof outside Kolkata/WB/India-national. City pages for Mumbai/Delhi/etc. would be fake local pages. Verdict: DO NOT create; keep Kolkata + West Bengal + India-national rows.
3. **Branding cluster (2291):** no branding/identity service is sold (services.html has 8 offers, none is brand identity). Portfolio shows brand films, but that is production, not identity work. Verdict: do not build a branding service page; let portfolio answer branded queries incidentally.
4. **YouTube cluster (1211):** overlaps Influencer (110+ YouTubers). No YouTube-Ads/SEO/channel-management service is sold. Verdict: merge into Influencer; no separate page.
5. **Creative Advertising (2655):** overlaps Content Production + Portfolio. Verdict: merge; no separate page.
6. **Suggested `/services/*` URLs:** do not exist (site is flat `.html` + anchors). Mapping must be translated to real URLs (Phase 5).

## 5. Targetable core (realistic)

- 44 Brand + ~90 legitimate core service heads (Meta/paid-social/retargeting, SEO, social, influencer/creator incl. YouTube-creator rows, content/video production, growth/digital-marketing generics) + Kolkata/WB/India modifiers + ~990 informational/long-tail rows (330 info + 660 info/commercial).
- Everything else (google-ads/ppc-management, non-Kolkata cities, branding-identity, standalone YouTube-management) is documented as DO-NOT-TARGET with reasons (Phase 4.H).
