-- ─── 008_access_requests: request-to-join flow (idempotent) ───────────────────
-- People ask for access from the sign-in screen; owners approve/decline in
-- the Team tab. No manual ID typing needed.

CREATE TABLE IF NOT EXISTS access_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at    TIMESTAMPTZ,
  decided_by    TEXT
);
CREATE INDEX IF NOT EXISTS idx_access_req_status ON access_requests (status, created_at DESC);
