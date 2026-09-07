// /api/cms/me — session info + team (access) management.
// GET (no query): who am I? (owner + editor)
// GET ?list=1: all authorized members (owner only)
// POST: authorize a new member {email, clerk_user_id, role} (owner only)
// PATCH: change a member's role {clerk_user_id, role} (owner only)
// DELETE ?clerk_user_id=: remove a member (owner only; never self/last owner)
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, method, friendly } from '../_lib/auth.js';

const ROLES = ['owner', 'editor'];

function validEmail(v) {
  const email = String(v || '').trim().slice(0, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw friendly(400, 'Please enter a valid email address.');
  }
  return email;
}
function validClerkId(v) {
  const clerkId = String(v || '').trim();
  if (!/^user_[A-Za-z0-9]+$/.test(clerkId)) {
    throw friendly(400, 'That Clerk user ID doesn’t look right — it starts with “user_”. Find it in Clerk Dashboard → Users → click the person.');
  }
  return clerkId;
}
function validRole(v) {
  const role = String(v || 'editor');
  if (!ROLES.includes(role)) throw friendly(400, 'Something went wrong. Please try again.');
  return role;
}

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET', 'POST', 'PATCH', 'DELETE'])) return;
    rateLimit(req, { max: 120 });

    if (req.method === 'GET' && !req.query.list) {
      const { clerkUserId, user } = await requireCmsUser(req);
      await audit(clerkUserId, 'access', 'session', '', { email: user.email, summary: 'Signed in to the Website Manager' });
      return send(res, 200, {
        user: { email: user.email, role: user.role, clerkUserId },
        uploadsEnabled: Boolean(
          process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET,
        ),
      });
    }

    // Everything below is owner-only.
    const { clerkUserId: me } = await requireCmsUser(req, { roles: ['owner'] });
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`SELECT clerk_user_id, email, role, created_at FROM cms_users ORDER BY created_at`;
      return send(res, 200, { members: rows, self: me });
    }

    if (req.method === 'POST') {
      const email = validEmail(req.body && req.body.email);
      const clerkId = validClerkId(req.body && (req.body.clerk_user_id || req.body.clerkUserId));
      const role = validRole(req.body && req.body.role);
      const rows = await sql`
        INSERT INTO cms_users (clerk_user_id, email, role)
        VALUES (${clerkId}, ${email}, ${role})
        ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, updated_at = NOW()
        RETURNING clerk_user_id, email, role, created_at`;
      await audit(me, 'team_add', 'cms_users', clerkId, { summary: `Gave ${email} ${role} access` });
      return send(res, 201, { member: rows[0] });
    }

    if (req.method === 'PATCH') {
      const clerkId = validClerkId(req.body && (req.body.clerk_user_id || req.body.clerkUserId));
      const role = validRole(req.body && req.body.role);
      if (clerkId === me) throw friendly(400, 'You can’t change your own role.');
      const owners = await sql`SELECT COUNT(*)::int AS n FROM cms_users WHERE role = 'owner'`;
      const target = await sql`SELECT role FROM cms_users WHERE clerk_user_id = ${clerkId} LIMIT 1`;
      if (!target[0]) throw friendly(404, 'That member no longer exists. Please refresh and try again.');
      if (target[0].role === 'owner' && role !== 'owner' && owners[0].n <= 1) {
        throw friendly(400, 'There must always be at least one owner.');
      }
      const rows = await sql`UPDATE cms_users SET role = ${role}, updated_at = NOW() WHERE clerk_user_id = ${clerkId} RETURNING clerk_user_id, email, role, created_at`;
      await audit(me, 'team_role', 'cms_users', clerkId, { summary: `Changed ${rows[0].email} to ${role}` });
      return send(res, 200, { member: rows[0] });
    }

    // DELETE
    const id = String(req.query.clerk_user_id || (req.body && req.body.clerk_user_id) || '');
    if (!/^user_[A-Za-z0-9]+$/.test(id)) throw friendly(400, 'Something went wrong. Please try again.');
    if (id === me) throw friendly(400, 'You can’t remove yourself.');
    const owners = await sql`SELECT COUNT(*)::int AS n FROM cms_users WHERE role = 'owner'`;
    const target = await sql`SELECT email, role FROM cms_users WHERE clerk_user_id = ${id} LIMIT 1`;
    if (!target[0]) throw friendly(404, 'That member no longer exists. Please refresh and try again.');
    if (target[0].role === 'owner' && owners[0].n <= 1) {
      throw friendly(400, 'There must always be at least one owner.');
    }
    await sql`DELETE FROM cms_users WHERE clerk_user_id = ${id}`;
    await audit(me, 'team_remove', 'cms_users', id, { summary: `Removed ${target[0].email}’s access` });
    return send(res, 200, { ok: true });
  } catch (err) {
    handleError(res, err);
  }
}
