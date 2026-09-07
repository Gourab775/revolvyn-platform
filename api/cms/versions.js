// /api/cms/versions — GET history / POST restore.
// A restore writes the snapshot back into DRAFT tables (as new unpublished
// state) and logs a new version — history is never destroyed.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, friendly } from '../_lib/auth.js';
import { restoreBody, parseOr400 } from '../_lib/validate.js';

export default async function handler(req, res) {
  try {
    rateLimit(req, { max: 60 });
    const { clerkUserId } = await requireCmsUser(req);
    const sql = db();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, entity_type, note, created_by, created_at FROM content_versions
        ORDER BY created_at DESC LIMIT 50`;
      return send(res, 200, { versions: rows });
    }

    if (req.method === 'POST') {
      const { version_id } = parseOr400(restoreBody, req.body);
      const found = await sql`SELECT * FROM content_versions WHERE id = ${version_id} LIMIT 1`;
      const snap = found[0]?.snapshot;
      if (!snap) throw friendly(404, 'That version is no longer available. Please refresh and try again.');

      // Restore draft tables from the snapshot (visible + hidden items alike).
      for (const s of snap.sections || []) {
        await sql.unsafe(
          `UPDATE page_sections SET data = $1::jsonb, is_visible = $2, sort_order = $3,
            has_unpublished_changes = TRUE, updated_at = NOW()
           FROM pages p WHERE page_sections.page_id = p.id AND p.slug = $4 AND page_sections.section_key = $5`,
          [JSON.stringify(s.data || {}), s.visible !== false, s.order || 0, s.page, s.key],
        );
      }
      const restoreList = async (table, items, map) => {
        await sql.unsafe(`DELETE FROM ${table}`);
        for (let i = 0; i < (items || []).length; i++) {
          const it = items[i];
          const cols = Object.keys(map);
          const vals = cols.map((c) => map[c](it, i));
          await sql.unsafe(
            `INSERT INTO ${table} (${cols.join(', ')}, has_unpublished_changes) VALUES (${cols.map((_, k) => `$${k + 1}`).join(', ')}, TRUE)`,
            vals.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)),
          );
        }
      };
      await restoreList('portfolio_items', snap.portfolio, {
        title: (p) => p.title || '', slug: (p) => p.slug || `restored-${Date.now()}`,
        description: (p) => p.description || '', thumbnail: (p) => p.thumbnail || '',
        video_url: (p) => p.video || '', external_url: (p) => p.url || '',
        client_name: (p) => p.client || '', category: (p) => p.category || '',
        is_visible: (p) => p.visible !== false, sort_order: (p, i) => p.order ?? i,
      });
      await restoreList('brands', snap.brands, {
        name: (b) => b.name || '', slug: (b) => b.slug || `restored-brand-${Date.now()}`,
        logo: (b) => b.logo || '', website_url: (b) => b.url || '',
        is_visible: (b) => b.visible !== false, sort_order: (b, i) => b.order ?? i,
      });
      await restoreList('services', snap.services, {
        title: (s) => s.title || '', slug: (s) => s.slug || `restored-service-${Date.now()}`,
        description: (s) => s.description || '',
        image: (s) => s.image || '', icon: (s) => s.icon || '', details: (s) => s.details || [],
        is_visible: (s) => s.visible !== false, sort_order: (s, i) => s.order ?? i,
      });
      await restoreList('testimonials', snap.testimonials, {
        name: (t) => t.name || '', slug: (t) => t.slug || `restored-${Date.now()}`,
        company: (t) => t.company || '', role: (t) => t.role || '',
        content: (t) => t.content || '', photo: (t) => t.photo || '',
        is_visible: (t) => t.visible !== false, sort_order: (t, i) => t.order ?? i,
      });
      for (const [k, v] of Object.entries(snap.settings || {})) {
        await sql`INSERT INTO site_settings (key, value, has_unpublished_changes, updated_by)
                  VALUES (${k}, ${JSON.stringify(v)}::jsonb, TRUE, ${clerkUserId})
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value,
                    has_unpublished_changes = TRUE, updated_at = NOW(), updated_by = EXCLUDED.updated_by`;
      }
      await sql`INSERT INTO content_versions (entity_type, snapshot, note, created_by)
                VALUES ('site', ${JSON.stringify(snap)}::jsonb, 'Restored to drafts', ${clerkUserId})`;
      await audit(clerkUserId, 'restore', 'site', version_id, {});
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Something went wrong. Please try again.' });
  } catch (err) {
    handleError(res, err);
  }
}
