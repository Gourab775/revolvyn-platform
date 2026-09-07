// POST /api/cms/preview-token — mint a short-lived draft preview token.
// Used to open a live-looking preview tab (?cms_preview=<token>) without
// exposing the Clerk session. Token is READ-ONLY (draft fetch only,
// 15-minute expiry) and can never mutate content.
import crypto from 'node:crypto';
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['POST'])) return;
    rateLimit(req, { max: 20 });
    const { clerkUserId } = await requireCmsUser(req);
    const sql = db();
    await sql`DELETE FROM preview_tokens WHERE expires_at < NOW()`;
    const token = crypto.randomBytes(32).toString('hex');
    const rows = await sql`
      INSERT INTO preview_tokens (token, clerk_user_id, expires_at)
      VALUES (${token}, ${clerkUserId}, NOW() + INTERVAL '15 minutes')
      RETURNING token, expires_at`;
    await audit(clerkUserId, 'preview', 'site', '', { summary: 'Opened a website preview' });
    send(res, 200, { token: rows[0].token, expiresAt: rows[0].expires_at });
  } catch (err) {
    handleError(res, err);
  }
}
