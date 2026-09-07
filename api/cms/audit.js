// GET /api/cms/audit — recent activity (owner + editor can view).
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET'])) return;
    rateLimit(req, { max: 60 });
    await requireCmsUser(req);
    const sql = db();
    const rows = await sql`
      SELECT a.*, COALESCE(u.email, a.actor_clerk_id) AS actor
      FROM audit_logs a LEFT JOIN cms_users u ON u.clerk_user_id = a.actor_clerk_id
      ORDER BY a.created_at DESC LIMIT 100`;
    send(res, 200, { log: rows });
  } catch (err) {
    handleError(res, err);
  }
}
