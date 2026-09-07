// /api/cms/versions — GET history / POST restore.
// A restore writes the snapshot back into DRAFT tables (as new unpublished
// state) and logs a new version — history is never destroyed.
import { db, unsafe } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, friendly } from '../_lib/auth.js';
import { restoreBody, parseOr400 } from '../_lib/validate.js';

export default async function handler(req, res) {
  try {
    rateLimit(req, { max: 60 });
    const { clerkUserId } = await requireCmsUser(req);
    const sql = db();

    if (req.method === 'GET') {
      const onlyId = String(req.query.id || '');
      if (/^[0-9a-f-]{36}$/i.test(onlyId)) {
        const one = await sql`
          SELECT v.*, COALESCE(u.email, 'Owner') AS by_email
          FROM content_versions v LEFT JOIN cms_users u ON u.clerk_user_id = v.created_by
          WHERE v.id = ${onlyId} LIMIT 1`;
        if (!one[0]) throw friendly(404, 'That version is no longer available. Please refresh and try again.');
        return send(res, 200, { version: one[0] });
      }
      const rows = await sql`
        SELECT v.id, v.entity_type, v.note, v.created_by, v.created_at,
               COALESCE(u.email, 'Owner') AS by_email
        FROM content_versions v LEFT JOIN cms_users u ON u.clerk_user_id = v.created_by
        ORDER BY v.created_at DESC LIMIT 50`;
      return send(res, 200, { versions: rows });
    }

    if (req.method === 'POST') {
      const { version_id } = parseOr400(restoreBody, req.body);
      const found = await sql`SELECT * FROM content_versions WHERE id = ${version_id} LIMIT 1`;
      const snap = found[0]?.snapshot;
      if (!snap) throw friendly(404, 'That version is no longer available. Please refresh and try again.');

      // Restore draft tables from the snapshot (visible + hidden items alike).
      for (const s of snap.sections || []) {
        await unsafe(sql, 
          `UPDATE page_sections SET data = $1::jsonb, is_visible = $2, sort_order = $3,
            has_unpublished_changes = TRUE, updated_at = NOW()
           FROM pages p WHERE page_sections.page_id = p.id AND p.slug = $4 AND page_sections.section_key = $5`,
          [JSON.stringify(s.data || {}), s.visible !== false, s.order || 0, s.page, s.key],
        );
      }
      const restoreList = async (table, items, map) => {
        await unsafe(sql, `DELETE FROM ${table}`);
        for (let i = 0; i < (items || []).length; i++) {
          const it = items[i];
          const cols = Object.keys(map);
          const vals = cols.map((c) => map[c](it, i));
          await unsafe(sql, 
            `INSERT INTO ${table} (${cols.join(', ')}, has_unpublished_changes) VALUES (${cols.map((_, k) => `$${k + 1}`).join(', ')}, TRUE)`,
            vals.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)),
          );
        }
      };
      await restoreList('portfolio_items', snap.portfolio, {
        title: (p) => p.title || '', slug: (p, i) => p.slug || `restored-${Date.now()}-${i}`,
        description: (p) => p.description || '', thumbnail: (p) => p.thumbnail || '',
        video_url: (p) => p.video || '', external_url: (p) => p.url || '',
        client_name: (p) => p.client || '', category: (p) => p.category || '',
        layout: (p) => (p.layout === 'portrait' ? 'portrait' : 'landscape'),
        is_visible: (p) => p.visible !== false, sort_order: (p, i) => p.order ?? i,
      });
      await restoreList('brands', snap.brands, {
        name: (b) => b.name || '', slug: (b, i) => b.slug || `restored-brand-${Date.now()}-${i}`,
        logo: (b) => b.logo || '', website_url: (b) => b.url || '',
        is_visible: (b) => b.visible !== false, sort_order: (b, i) => b.order ?? i,
      });
      await restoreList('services', snap.services, {
        title: (s) => s.title || '', slug: (s, i) => s.slug || `restored-service-${Date.now()}-${i}`,
        description: (s) => s.description || '',
        image: (s) => s.image || '', icon: (s) => s.icon || '', details: (s) => s.details || [],
        is_visible: (s) => s.visible !== false, sort_order: (s, i) => s.order ?? i,
      });
      await restoreList('testimonials', snap.testimonials, {
        name: (t) => t.name || '', slug: (t, i) => t.slug || `restored-${Date.now()}-${i}`,
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
      const when = found[0]?.created_at ? new Date(found[0].created_at).toLocaleString() : 'earlier version';
      await audit(clerkUserId, 'restore', 'site', version_id, { summary: `Restored ${when} to drafts` });
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Something went wrong. Please try again.' });
  } catch (err) {
    handleError(res, err);
  }
}
