// POST /api/cms/publish — snapshot ALL drafts into one published payload.
// Explicit, confirmed in the UI. Creates: cms_publications row (what the live
// site reads) + content_versions snapshot (restorable) + audit entry.
// After publish, clears has_unpublished_changes flags.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['POST'])) return;
    rateLimit(req, { max: 20 });
    const { clerkUserId } = await requireCmsUser(req);
    const sql = db();

    const [sections, portfolio, brands, services, testimonials, settings] = await Promise.all([
      sql`SELECT s.id, p.slug AS page, s.section_key, s.section_type, s.data, s.sort_order, s.is_visible
          FROM page_sections s JOIN pages p ON p.id = s.page_id ORDER BY p.slug, s.sort_order`,
      sql`SELECT * FROM portfolio_items ORDER BY sort_order, created_at`,
      sql`SELECT * FROM brands ORDER BY sort_order, created_at`,
      sql`SELECT * FROM services ORDER BY sort_order, created_at`,
      sql`SELECT * FROM testimonials ORDER BY sort_order, created_at`,
      sql`SELECT key, value FROM site_settings`,
    ]);

    const payload = {
      version: 1,
      sections: sections.map((s) => ({
        page: s.page, key: s.section_key, type: s.section_type,
        data: s.data, order: s.sort_order, visible: s.is_visible,
      })),
      portfolio: portfolio.map((p) => ({
        id: p.id, title: p.title, slug: p.slug, description: p.description,
        thumbnail: p.thumbnail, video: p.video_url, url: p.external_url,
        client: p.client_name, category: p.category, order: p.sort_order, visible: p.is_visible,
      })),
      brands: brands.map((b) => ({
        id: b.id, name: b.name, slug: b.slug, logo: b.logo, url: b.website_url,
        order: b.sort_order, visible: b.is_visible,
      })),
      services: services.map((s) => ({
        id: s.id, title: s.title, slug: s.slug, description: s.description, image: s.image,
        icon: s.icon, details: s.details, order: s.sort_order, visible: s.is_visible,
      })),
      testimonials: testimonials.map((t) => ({
        id: t.id, slug: t.slug, name: t.name, company: t.company, role: t.role,
        content: t.content, photo: t.photo, order: t.sort_order, visible: t.is_visible,
      })),
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    };

    const pub =
      await sql`INSERT INTO cms_publications (scope, payload, created_by)
                VALUES ('site', ${JSON.stringify(payload)}::jsonb, ${clerkUserId}) RETURNING id, created_at`;
    await sql`INSERT INTO content_versions (entity_type, snapshot, note, created_by)
              VALUES ('site', ${JSON.stringify(payload)}::jsonb, 'Published', ${clerkUserId})`;
    await sql`UPDATE page_sections SET has_unpublished_changes = FALSE`;
    await sql`UPDATE portfolio_items SET has_unpublished_changes = FALSE`;
    await sql`UPDATE brands SET has_unpublished_changes = FALSE`;
    await sql`UPDATE services SET has_unpublished_changes = FALSE`;
    await sql`UPDATE testimonials SET has_unpublished_changes = FALSE`;
    await sql`UPDATE site_settings SET has_unpublished_changes = FALSE`;
    await audit(clerkUserId, 'publish', 'site', pub[0].id, {});

    send(res, 200, { ok: true, publishedAt: pub[0].created_at });
  } catch (err) {
    handleError(res, err);
  }
}
