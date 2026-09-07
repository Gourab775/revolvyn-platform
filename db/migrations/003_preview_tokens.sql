-- ─── 003_preview_tokens: short-lived draft-preview access ───────────────────
-- Tokens grant READ-ONLY draft access for visual preview/edit mode.
-- They can never mutate anything (mutations always need a Clerk session).

CREATE TABLE IF NOT EXISTS preview_tokens (
  token         TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_preview_expiry ON preview_tokens (expires_at);
