-- ─── REVOLVYN Owner CMS — full schema (Neon PostgreSQL) ────────────────────
-- Reproducible on a fresh database:  psql $DATABASE_URL -f db/schema.sql
-- or:  npm run db:migrate
-- Content tables hold DRAFT state. The live site only ever reads the latest
-- row in cms_publications (written by Publish). Drafts never leak publicly.

-- Extensions ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: updated_at auto-touch ------------------------------------------------
CREATE OR REPLACE FUNCTION cms_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.has_unpublished_changes = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Authorized CMS users (Clerk is the identity provider; this table is the
-- authorization list — a Clerk account with NO row here gets 403) -------------
CREATE TABLE IF NOT EXISTS cms_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pages ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flexible page sections (homepage hero, about, quote, CTA, contact blocks…)
-- `data` = draft JSON edited in the CMS. Never served to the public directly.
CREATE TABLE IF NOT EXISTS page_sections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id                 UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key             TEXT NOT NULL,
  section_type            TEXT NOT NULL DEFAULT 'generic',
  data                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_visible              BOOLEAN NOT NULL DEFAULT TRUE,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_id, section_key)
);
DROP TRIGGER IF EXISTS trg_page_sections_touch ON page_sections;
CREATE TRIGGER trg_page_sections_touch
  BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION cms_touch_updated_at();

-- Portfolio / projects --------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL DEFAULT '',
  slug                    TEXT NOT NULL UNIQUE,
  description             TEXT NOT NULL DEFAULT '',
  thumbnail               TEXT NOT NULL DEFAULT '',
  video_url               TEXT NOT NULL DEFAULT '',
  external_url            TEXT NOT NULL DEFAULT '',
  client_name             TEXT NOT NULL DEFAULT '',
  category                TEXT NOT NULL DEFAULT '',
  is_visible              BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_portfolio_touch ON portfolio_items;
CREATE TRIGGER trg_portfolio_touch
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION cms_touch_updated_at();

-- Brands ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL DEFAULT '',
  slug                    TEXT NOT NULL UNIQUE,
  logo                    TEXT NOT NULL DEFAULT '',
  website_url             TEXT NOT NULL DEFAULT '',
  is_visible              BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_brands_touch ON brands;
CREATE TRIGGER trg_brands_touch
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION cms_touch_updated_at();

-- Services --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL DEFAULT '',
  slug                    TEXT NOT NULL UNIQUE,
  description             TEXT NOT NULL DEFAULT '',
  image                   TEXT NOT NULL DEFAULT '',
  icon                    TEXT NOT NULL DEFAULT '',
  details                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_visible              BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_services_touch ON services;
CREATE TRIGGER trg_services_touch
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION cms_touch_updated_at();

-- Testimonials (site has none yet — table ready, CMS shows an empty state) ----
CREATE TABLE IF NOT EXISTS testimonials (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE,
  name                    TEXT NOT NULL DEFAULT '',
  company                 TEXT NOT NULL DEFAULT '',
  role                    TEXT NOT NULL DEFAULT '',
  content                 TEXT NOT NULL DEFAULT '',
  photo                   TEXT NOT NULL DEFAULT '',
  is_visible              BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_testimonials_touch ON testimonials;
CREATE TRIGGER trg_testimonials_touch
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION cms_touch_updated_at();

-- Global settings (contact info, socials, footer…). One row per key. ---------
CREATE TABLE IF NOT EXISTS site_settings (
  key                     TEXT PRIMARY KEY,
  value                   JSONB NOT NULL DEFAULT '" "'::jsonb,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by              TEXT
);

-- Publications: each Publish writes ONE row with the full live snapshot. -----
CREATE TABLE IF NOT EXISTS cms_publications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      TEXT NOT NULL DEFAULT 'site',
  payload    JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_publications_scope_time
  ON cms_publications (scope, created_at DESC);

-- Version history: snapshot per publish + manual checkpoints; restore never
-- deletes history (a restore writes a NEW draft state + a new version row). --
CREATE TABLE IF NOT EXISTS content_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  snapshot    JSONB NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_versions_entity_time
  ON content_versions (entity_type, created_at DESC);

-- Audit log -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_clerk_id TEXT,
  action         TEXT NOT NULL,
  entity_type    TEXT NOT NULL DEFAULT '',
  entity_id      TEXT NOT NULL DEFAULT '',
  meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (created_at DESC);
