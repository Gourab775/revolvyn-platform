-- ─── 004_homepage_curation: featured strip + local marquee brands ────────────
-- The homepage strip shows featured projects; the marquee starts with the
-- five local logo files — exactly matching the built-in homepage.
-- Idempotent: safe to re-run.

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE portfolio_items SET featured = TRUE WHERE slug IN
  ('elevenlabs-1', 'nike-1', 'eatfesto-1', 'relance', 'crispana-1', 'sonepar');

-- Make room at the top for the five built-in marquee logos (once only).
UPDATE brands SET sort_order = sort_order + 5
WHERE slug NOT LIKE 'home-brand-%'
  AND NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-1');

INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order)
SELECT 'Brand 1', 'home-brand-1', 'brand logos/Untitled design (1)-Photoroom.png', '', TRUE, 0
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-1');

INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order)
SELECT 'Brand 2', 'home-brand-2', 'brand logos/Untitled design (2)-Photoroom.png', '', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-2');

INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order)
SELECT 'Brand 3', 'home-brand-3', 'brand logos/Untitled design (6)-Photoroom.png', '', TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-3');

INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order)
SELECT 'Brand 4', 'home-brand-4', 'brand logos/Untitled design (8)-Photoroom.png', '', TRUE, 3
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-4');

INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order)
SELECT 'Brand 5', 'home-brand-5', 'brand logos/Untitled design (10)-Photoroom.png', '', TRUE, 4
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'home-brand-5');
