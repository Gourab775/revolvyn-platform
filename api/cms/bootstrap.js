// /api/cms/bootstrap — access control center.
// POST {action?: 'claim'} — first-owner claim. Works ONLY while cms_users is
//   empty (sealed forever after). Requires a valid Clerk session.
// POST {action: 'request', email} — any signed-in Clerk user asks for access.
//   Creates a pending request the owner approves in the Team tab.
// POST {action: 'decide', request_id, decision: 'approve'|'decline', role?} —
//   owner approves (creates the member) or declines (removes the request).
// GET — list pending requests (owner only).
import { verifyToken } from '@clerk/backend';
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, friendly, audit, rateLimit, method } from '../_lib/auth.js';

async function clerkSession(req) {
  if (!process.env.CLERK_SECRET_KEY) throw friendly(500, 'Something went wrong. Please try again.');
  const header = req.headers.authorization || '';
  const token = (header.match(/^Bearer\s+(.+)$/i) || [])[1];
  if (!token) throw friendly(401, 'Session expired. Please sign in again.');
  try {
    return await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    throw friendly(401, 'Session expired. Please sign in again.');
  }
}

function cleanEmail(v) {
  const email = String(v || '').trim().slice(0, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw friendly(400, 'Please enter a valid email address.');
  }
  return email;
}

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET', 'POST'])) return;
    rateLimit(req, { max: 30 });
    const sql = db();

    if (req.method === 'GET') {
      const { clerkUserId } = await requireCmsUser(req, { roles: ['owner'] });
      void clerkUserId;
      const rows = await sql`SELECT id, clerk_user_id, email, created_at FROM access_requests WHERE status = 'pending' ORDER BY created_at`;
      return send(res, 200, { requests: rows });
    }

    const action = String((req.body && req.body.action) || 'claim');

    if (action === 'request') {
      const session = await clerkSession(req);
      const email = cleanEmail(req.body && req.body.email);
      const member = await sql`SELECT 1 FROM cms_users WHERE clerk_user_id = ${session.sub} LIMIT 1`;
      if (member[0]) throw friendly(409, 'You already have access — just sign in.');
      const existing = await sql`SELECT status FROM access_requests WHERE clerk_user_id = ${session.sub} LIMIT 1`;
      if (existing[0] && existing[0].status === 'pending') {
        throw friendly(409, 'Request already sent — the owner will approve it soon.');
      }
      await sql`INSERT INTO access_requests (clerk_user_id, email, status)
                VALUES (${session.sub}, ${email}, 'pending')
                ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, status = 'pending', created_at = NOW(), decided_at = NULL, decided_by = NULL`;
      await audit(session.sub, 'access_request', 'access_requests', session.sub, { summary: `${email} requested access` });
      return send(res, 201, { ok: true });
    }

    if (action === 'decide') {
      const { clerkUserId: me } = await requireCmsUser(req, { roles: ['owner'] });
      const requestId = String((req.body && req.body.request_id) || '');
      const decision = String((req.body && req.body.decision) || '');
      if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw friendly(400, 'Something went wrong. Please try again.');
      if (decision !== 'approve' && decision !== 'decline') throw friendly(400, 'Something went wrong. Please try again.');
      const found = await sql`SELECT * FROM access_requests WHERE id = ${requestId} AND status = 'pending' LIMIT 1`;
      if (!found[0]) throw friendly(404, 'That request is no longer waiting.');
      if (decision === 'approve') {
        const role = String((req.body && req.body.role) || 'editor');
        if (role !== 'owner' && role !== 'editor') throw friendly(400, 'Something went wrong. Please try again.');
        await sql`INSERT INTO cms_users (clerk_user_id, email, role)
                  VALUES (${found[0].clerk_user_id}, ${found[0].email}, ${role})
                  ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, updated_at = NOW()`;
        await sql`DELETE FROM access_requests WHERE id = ${requestId}`;
        await audit(me, 'team_add', 'cms_users', found[0].clerk_user_id, { summary: `Approved ${found[0].email} as ${role}` });
        return send(res, 200, { ok: true, role });
      }
      await sql`DELETE FROM access_requests WHERE id = ${requestId}`;
      await audit(me, 'team_decline', 'access_requests', requestId, { summary: `Declined ${found[0].email}’s request` });
      return send(res, 200, { ok: true });
    }

    // Default: first-owner claim (sealed once anyone exists).
    const session = await clerkSession(req);
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
