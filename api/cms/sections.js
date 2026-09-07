// PATCH /api/cms/sections — bulk save page-section drafts (text, visibility,
// order). Sanitized server-side; publishing is a separate explicit step.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, method, cleanText, cleanUrl, friendly } from '../_lib/auth.js';
import { sectionsBulk, parseOr400 } from '../_lib/validate.js';

const URL_KEYS = new Set(['image', 'logo', 'thumbnail', 'video', 'video_url', 'buttonUrl', 'website']);

function sanitizeData(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {}).slice(0, 40)) {
    const key = cleanText(k, 80);
    if (!key) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === 'boolean' || typeof v === 'number') {
      out[key] = v;
      continue;
    }
    const s = String(v);
    out[key] = URL_KEYS.has(key) ? cleanUrl(s) : cleanText(s, 5000);
  }
  return out;
}

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['PATCH'])) return;
    rateLimit(req, { max: 60 });
    const { clerkUserId } = await requireCmsUser(req);
    const { sections } = parseOr400(sectionsBulk, req.body);
    const sql = db();
    const saved = [];
    for (const s of sections) {
      if (!/^[0-9a-f-]{36}$/i.test(s.id)) throw friendly(400, 'Some fields look invalid. Please check them and try again.');
      const sets = ['data = $2::jsonb'];
      const vals = [s.id, JSON.stringify(sanitizeData(s.data))];
      if (s.is_visible !== undefined) {
        vals.push(s.is_visible);
        sets.push(`is_visible = $${vals.length}`);
      }
      if (s.sort_order !== undefined) {
        vals.push(s.sort_order);
        sets.push(`sort_order = $${vals.length}`);
      }
      sets.push('updated_at = NOW()', 'has_unpublished_changes = TRUE');
      const rows = await sql.unsafe(
        `UPDATE page_sections SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        vals,
      );
      if (rows[0]) saved.push(rows[0]);
    }
    await audit(clerkUserId, 'update', 'page_sections', '', { count: saved.length });
    send(res, 200, { sections: saved });
  } catch (err) {
    handleError(res, err);
  }
}
