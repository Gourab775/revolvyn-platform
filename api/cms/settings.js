// /api/cms/settings — GET draft settings / PATCH settings drafts.
// Only pre-approved keys are writable; unknown keys are rejected.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, cleanText, friendly } from '../_lib/auth.js';
import { settingsPatch, parseOr400 } from '../_lib/validate.js';

const ALLOWED_KEYS = new Set([
  'contact.email', 'contact.phone', 'contact.office', 'contact.hours',
  'social.instagram', 'social.facebook', 'social.youtube',
  'footer.tagline', 'footer.copyright',
]);

export default async function handler(req, res) {
  try {
    rateLimit(req, { max: 120 });
    const { clerkUserId } = await requireCmsUser(req);
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value, has_unpublished_changes, updated_at FROM site_settings ORDER BY key`;
      return send(res, 200, { settings: rows });
    }

    if (req.method === 'PATCH') {
      const { settings } = parseOr400(settingsPatch, req.body);
      const saved = [];
      for (const [key, value] of Object.entries(settings)) {
        if (!ALLOWED_KEYS.has(key)) throw friendly(400, 'Some fields look invalid. Please check them and try again.');
        const clean = typeof value === 'string' ? cleanText(value, 2000) : value;
        const rows = await sql`
          INSERT INTO site_settings (key, value, has_unpublished_changes, updated_by)
          VALUES (${key}, ${JSON.stringify(clean)}::jsonb, TRUE, ${clerkUserId})
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, has_unpublished_changes = TRUE,
              updated_at = NOW(), updated_by = EXCLUDED.updated_by
          RETURNING *`;
        saved.push(rows[0]);
      }
      await audit(clerkUserId, 'update', 'site_settings', '', { keys: Object.keys(settings) });
      return send(res, 200, { settings: saved });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return send(res, 405, { error: 'Something went wrong. Please try again.' });
  } catch (err) {
    handleError(res, err);
  }
}
