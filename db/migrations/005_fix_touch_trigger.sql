-- ─── 005_fix_touch_trigger: respect explicit draft-flag clears ────────────────
-- Bug: cms_touch_updated_at() forced has_unpublished_changes = TRUE on EVERY
-- UPDATE — including Publish's clearing and migration resets. So flags could
-- never return to FALSE (phantom "unpublished" state forever).
-- Fix: an explicit TRUE→FALSE transition is respected; everything else marks
-- the row dirty as before. Then clear all flags left dirty by past runs.

CREATE OR REPLACE FUNCTION cms_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.has_unpublished_changes = FALSE AND OLD.has_unpublished_changes = TRUE THEN
    -- explicit clear (publish, migration reset): keep FALSE
    NEW.has_unpublished_changes = FALSE;
  ELSE
    NEW.has_unpublished_changes = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE page_sections SET has_unpublished_changes = FALSE;
UPDATE portfolio_items SET has_unpublished_changes = FALSE;
UPDATE brands SET has_unpublished_changes = FALSE;
UPDATE services SET has_unpublished_changes = FALSE;
UPDATE testimonials SET has_unpublished_changes = FALSE;
UPDATE site_settings SET has_unpublished_changes = FALSE;
