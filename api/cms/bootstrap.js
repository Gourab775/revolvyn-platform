// POST /api/cms/bootstrap — first-owner claim. Works ONLY while cms_users
// is empty (sealed forever after). Requires a valid Clerk session so the
// claimed identity is real; the developer then confirms it.
import { verifyToken } from '@clerk/backend';
import { db } from '../_lib/db.js';
import { send, handleError, friendly, audit, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['POST'])) return;
    rateLimit(req, { max: 10 });
    if (!process.env.CLERK_SECRET_KEY) throw friendly(500, 'Something went wrong. Please try again.');

    const header = req.headers.authorization || '';
    const token = (header.match(/^Bearer\s+(.+)$/i) || [])[1];
    if (!token) throw friendly(401, 'Please sign in again to continue.');
    let session;
    try {
      session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    } catch {
      throw friendly(401, 'Please sign in again to continue.');
    }

    const sql = db();
    const existing = await sql`SELECT COUNT(*)::int AS n FROM cms_users`;
    if (existing[0].n > 0) throw friendly(403, 'Setup is already complete. Ask the site owner for access.');

    const email = typeof req.body?.email === 'string' ? req.body.email.slice(0, 320) : '';
    await sql`INSERT INTO cms_users (clerk_user_id, email, role)
              VALUES (${session.sub}, ${email || session.email || 'owner'}, 'owner')`;
    await audit(session.sub, 'bootstrap_owner', 'cms_users', session.sub, { summary: 'Claimed the first owner account' });
    send(res, 200, { ok: true });
  } catch (err) {
    handleError(res, err);
  }
}
