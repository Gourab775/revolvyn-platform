// Public content — serves ONLY the latest PUBLISHED snapshot. No auth, cached.
// Drafts are never readable here, so unpublished edits can never leak.
import { db } from '../_lib/db.js';
import { send, handleError } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return send(res, 405, { error: 'Something went wrong. Please try again.' });
    }
    const sql = db();
    const rows = await sql`
      SELECT payload, created_at FROM cms_publications
      WHERE scope = 'site' ORDER BY created_at DESC LIMIT 1`;
    if (!rows[0]) return send(res, 200, { published: false });
    return send(res, 200, { published: true, updatedAt: rows[0].created_at, content: rows[0].payload });
  } catch (err) {
    // Public site must never break because the CMS backend hiccups:
    // signal "no content" so pages keep their built-in copy.
    console.error('[public-content]', err);
    return send(res, 200, { published: false });
  }
}
