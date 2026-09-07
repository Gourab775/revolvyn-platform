-- ─── 006_trigger_final: flag owned by application, not trigger ───────────────
-- Lesson from 005: a trigger cannot distinguish "SET flag = FALSE on an
-- already-clean row" from "didn't mention the flag" — so any blanket reset
-- re-dirtied clean rows. Final design: the trigger owns ONLY updated_at.
-- has_unpublished_changes is set explicitly by writers (API mutations set it
-- TRUE, Publish/migrations set it FALSE). Deterministic, no magic.

CREATE OR REPLACE FUNCTION cms_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE page_sections SET has_unpublished_changes = FALSE;
UPDATE portfolio_items SET has_unpublished_changes = FALSE;
UPDATE brands SET has_unpublished_changes = FALSE;
UPDATE services SET has_unpublished_changes = FALSE;
UPDATE testimonials SET has_unpublished_changes = FALSE;
UPDATE site_settings SET has_unpublished_changes = FALSE;
