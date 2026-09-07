// /api/cms/[resource] — CRUD + reorder for portfolio, brands, services,
// testimonials. One handler, strict allowlist; every request is Clerk
// authenticated AND checked against cms_users (owner/editor).
import { db, unsafe } from '../_lib/db.js';
import {
  send, handleError, requireCmsUser, audit, rateLimit,
  cleanText, cleanUrl, friendly,
} from '../_lib/auth.js';
import {
  portfolioCreate, portfolioUpdate, brandCreate, brandUpdate,
  serviceCreate, serviceUpdate, testimonialCreate, testimonialUpdate,
  reorderPatch, parseOr400,
} from '../_lib/validate.js';

const RESOURCES = {
  portfolio: {
    table: 'portfolio_items',
    create: portfolioCreate,
    update: portfolioUpdate,
    fields: ['title', 'slug', 'description', 'thumbnail', 'video_url', 'external_url', 'client_name', 'category'],
    urlFields: new Set(['thumbnail', 'video_url', 'external_url']),
    slugFrom: 'title',
  },
  brands: {
    table: 'brands',
    create: brandCreate,
    update: brandUpdate,
    fields: ['name', 'slug', 'logo', 'website_url'],
    urlFields: new Set(['logo', 'website_url']),
    slugFrom: 'name',
  },
  services: {
    table: 'services',
    create: serviceCreate,
    update: serviceUpdate,
    fields: ['title', 'slug', 'description', 'image', 'icon'],
    urlFields: new Set(['image']),
    slugFrom: 'title',
  },
  testimonials: {
    table: 'testimonials',
    create: testimonialCreate,
    update: testimonialUpdate,
    fields: ['name', 'slug', 'company', 'role', 'content', 'photo'],
    urlFields: new Set(['photo']),
    slugFrom: 'name',
  },
};

function slugify(title, fallback) {
  const s = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || fallback;
}

function sanitizeFields(cfg, data) {
  const out = {};
  for (const f of cfg.fields) {
    if (data[f] === undefined) continue;
    out[f] = cfg.urlFields.has(f) ? cleanUrl(String(data[f])) : cleanText(String(data[f]));
  }
  if (data.is_visible !== undefined) out.is_visible = Boolean(data.is_visible);
  if (data.sort_order !== undefined) {
    const n = Number(data.sort_order);
    if (Number.isFinite(n)) out.sort_order = Math.max(0, Math.min(10000, Math.round(n)));
  }
  if (cfg.table === 'portfolio_items' && (data.layout === 'portrait' || data.layout === 'landscape')) {
    out.layout = data.layout;
  }
  if (cfg.table === 'services' && data.details !== undefined && Array.isArray(data.details)) {
    out.details = data.details.slice(0, 20).map((pkg) => {
      if (typeof pkg === 'string') return { package: cleanText(pkg, 200), items: [] };
      const o = pkg && typeof pkg === 'object' ? pkg : {};
      return {
        package: cleanText(String(o.package ?? ''), 200),
        items: Array.isArray(o.items) ? o.items.slice(0, 40).map((i) => cleanText(String(i), 300)) : [],
        ...(o.note ? { note: cleanText(String(o.note), 300) } : {}),
      };
    });
  }
  return out;
}

export default async function handler(req, res) {
  try {
    rateLimit(req, { max: 120 });
    const { clerkUserId } = await requireCmsUser(req);
    const resource = String(req.query.resource || '');
    const cfg = RESOURCES[resource];
    if (!cfg) return send(res, 404, { error: 'Something went wrong. Please try again.' });
    const single = { portfolio: 'project', brands: 'brand', services: 'service', testimonials: 'testimonial' }[resource] || 'item';
    const itemName = (row) => String((row && (row.title || row.name)) || '').slice(0, 80);
    const sql = db();

    if (req.method === 'GET') {
      const rows = await unsafe(sql, 
        `SELECT * FROM ${cfg.table} ORDER BY sort_order, created_at`,
      );
      return send(res, 200, { items: rows });
    }

    if (req.method === 'POST' && req.query.action !== 'reorder') {
      const data = parseOr400(cfg.create, req.body);
      const clean = sanitizeFields(cfg, data);
      if (cfg.slugFrom && !clean.slug) {
        clean.slug = `${slugify(clean[cfg.slugFrom], resource.slice(0, -1))}-${Date.now().toString(36)}`;
      }
      const maxRow = await unsafe(sql, `SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM ${cfg.table}`);
      const cols = Object.keys(clean);
      const row =
        (await unsafe(sql, 
          `INSERT INTO ${cfg.table} (${['sort_order', ...cols].join(', ')})
           VALUES (${['$1', ...cols.map((_, i) => `$${i + 2}`)].join(', ')}) RETURNING *`,
          [maxRow[0].n, ...cols.map((c) => (c === 'details' ? JSON.stringify(clean[c]) : clean[c]))],
        ))[0];
      await audit(clerkUserId, 'create', resource, row.id, { title: row.title || row.name, summary: `Added ${single} “${itemName(row)}”` });
      return send(res, 201, { item: row });
    }

    if (req.method === 'PATCH' && req.query.action === 'reorder') {
      const { order } = parseOr400(reorderPatch, req.body);
      for (let i = 0; i < order.length; i++) {
        await unsafe(sql, `UPDATE ${cfg.table} SET sort_order = $1 WHERE id = $2`, [i, order[i]]);
      }
      await unsafe(sql, `UPDATE ${cfg.table} SET has_unpublished_changes = TRUE WHERE id = ANY($1::uuid[])`, [
        order,
      ]);
      await audit(clerkUserId, 'reorder', resource, '', { count: order.length, summary: `Reordered ${order.length} ${resource}` });
      return send(res, 200, { ok: true });
    }

    if (req.method === 'PATCH') {
      const data = parseOr400(cfg.update, req.body);
      const { id, ...rest } = data;
      const clean = sanitizeFields(cfg, rest);
      if (Object.keys(clean).length === 0) throw friendly(400, 'Nothing to save. Make a change first.');
      const sets = Object.keys(clean).map((c, i) =>
        c === 'details' ? `${c} = $${i + 2}::jsonb` : `${c} = $${i + 2}`,
      );
      const vals = Object.keys(clean).map((c) => (c === 'details' ? JSON.stringify(clean[c]) : clean[c]));
      const rows = await unsafe(sql, 
        `UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        [id, ...vals],
      );
      if (!rows[0]) throw friendly(404, 'That item no longer exists. Please refresh and try again.');
      await audit(clerkUserId, 'update', resource, id, { summary: `Updated ${single} “${itemName(rows[0])}”` });
      return send(res, 200, { item: rows[0] });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || req.body?.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw friendly(400, 'Something went wrong. Please try again.');
      const gone = (await unsafe(sql, `SELECT * FROM ${cfg.table} WHERE id = $1`, [id]))[0];
      const rows = await unsafe(sql, `DELETE FROM ${cfg.table} WHERE id = $1 RETURNING id`, [id]);
      if (!rows[0]) throw friendly(404, 'That item no longer exists. Please refresh and try again.');
      await audit(clerkUserId, 'delete', resource, id, { summary: `Deleted ${single} “${itemName(gone)}”` });
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return send(res, 405, { error: 'Something went wrong. Please try again.' });
  } catch (err) {
    handleError(res, err);
  }
}
