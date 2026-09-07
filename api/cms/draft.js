// GET /api/cms/draft — full DRAFT state.
// Auth: Clerk session (CMS) OR a short-lived ?preview= token (preview tab).
// This endpoint is strictly read-only either way.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, friendly, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET'])) return;
    rateLimit(req, { max: 120 });
    const previewToken = String(req.query.preview || '');
    if (/^[0-9a-f]{64}$/.test(previewToken)) {
      const sql = db();
      const found = await sql`
        SELECT clerk_user_id FROM preview_tokens
        WHERE token = ${previewToken} AND expires_at > NOW() LIMIT 1`;
      if (!found[0]) throw friendly(401, 'This preview has expired. Please open a new preview from the Website Manager.');
    } else if (previewToken) {
      throw friendly(401, 'This preview link is invalid. Please open a new preview from the Website Manager.');
    } else {
      await requireCmsUser(req);
    }
    const sql = db();

    const [pages, sections, portfolio, brands, services, testimonials, settings, pubs] =
      await Promise.all([
        sql`SELECT * FROM pages ORDER BY name`,
        sql`SELECT s.*, p.slug AS page_slug FROM page_sections s JOIN pages p ON p.id = s.page_id ORDER BY p.slug, s.sort_order`,
        sql`SELECT * FROM portfolio_items ORDER BY sort_order, created_at`,
        sql`SELECT * FROM brands ORDER BY sort_order, created_at`,
        sql`SELECT * FROM services ORDER BY sort_order, created_at`,
        sql`SELECT * FROM testimonials ORDER BY sort_order, created_at`,
        sql`SELECT key, value, has_unpublished_changes, updated_at FROM site_settings ORDER BY key`,
        sql`SELECT created_at FROM cms_publications WHERE scope='site' ORDER BY created_at DESC LIMIT 1`,
      ]);

    send(res, 200, {
      pages,
      sections,
      portfolio,
      brands,
      services,
      testimonials,
      settings,
      lastPublishedAt: pubs[0]?.created_at || null,
    });
  } catch (err) {
    handleError(res, err);
  }
}
