# REVOLVYN Owner CMS — Developer Setup Guide

The public site is still 100% static HTML/CSS/JS. The CMS adds:

- `manage.html` + `css/manage.css` + `js/cms/manage.js` — the owner dashboard (loaded only at `/manage`, never on public pages)
- `js/cms-content.js` — tiny public hydrator (~4 KB, `defer`); does nothing unless published content exists
- `api/` — Vercel serverless functions (Neon + Clerk). No build step, no framework migration
- `db/` — `schema.sql` + `seed.sql` + `migrate.mjs`
- `scripts/create-owner.mjs` — first-owner authorization

## 1. Create Clerk (authentication)

1. Go to https://dashboard.clerk.com → create an application → copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
2. In Clerk → Users → create the owner user (email sign-in is fine).
3. Click the user → copy the **User ID** (`user_…`) — you need it in step 3.

No other Clerk configuration is required. The sign-in form renders inside `/manage` automatically.

## 2. Create Neon (database)

1. Go to https://console.neon.tech → create a project → copy the **pooled** connection string → `DATABASE_URL`.
2. Run migrations + seed (copies current site copy verbatim into the CMS):
   ```bash
   npm install
   $env:DATABASE_URL="<pooled-connection-string>"   # PowerShell
   npm run db:migrate
   ```
   Re-running is safe (inserts are idempotent; schema uses `IF NOT EXISTS`).

## 3. Authorize the first owner

```bash
npm run cms:create-owner -- --clerk-id=user_xxxx --email=owner@example.com
```

- Only rows in `cms_users` can use the CMS; every other signed-in Clerk user gets **403**.
- Roles: `owner` (full access, default) and `editor` (same content access today; reserved for future restrictions). Pass `--role=editor` to add editors later.
- Emergency alternative (no CLI): sign in at `/manage` once, then on the “No access” screen press **Claim owner access** — this works **only while `cms_users` is empty** and seals itself afterwards.

## 4. Environment variables

Local: copy `.env.example` → `.env`. Vercel: Project → Settings → Environment Variables (same keys):

| Key | Where | Required |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | browser + server | yes |
| `CLERK_SECRET_KEY` | server only | yes |
| `DATABASE_URL` | server only | yes |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | server signs, browser uploads direct | optional — without it, owners paste media links |
| `CMS_FIRST_OWNER_*` | CLI helper only | optional |

## 5. Run locally

```bash
npx serve .            # public site at http://localhost:3000
vercel dev             # full stack incl. /api/* and /manage (recommended)
```

Open `/manage`, sign in, edit → **Preview website** (draft overlay) → **Publish changes**.

## 6. Deploy

Push to `main` (Vercel auto-deploys). `vercel.json` maps `/manage*` → `manage.html`, adds `noindex` to CMS routes, and caches only the public content endpoint. Public URLs (`/`, `/portfolio.html`, …) are unchanged.

> Multi-project setups: if the public domain is served by a different
> deployment without database access, that deployment automatically reads
> published content cross-origin from this project's `/api/public/content`
> (see `CONTENT_SOURCE` in `js/cms-content.js`). The owner must still use
> THIS project's `/manage` for all editing, preview and publishing —
> drafts and the CMS backend live only here.

> Hobby-plan note: Vercel allows max **12 serverless functions** per deployment.
> The CMS has exactly 12 (`api/public/*` × 2, `api/cms/*` × 10). Do NOT add a
> new file under `api/` without merging an existing one first — the 13th
> function fails the whole deployment. Prefer adding a method/query-action
> branch to the closest existing endpoint.

## 7. How content flows

```
Owner edits  →  Neon draft tables  →  Preview (auth, ?cms_preview=draft)
     →  Publish  →  cms_publications (snapshot) + content_versions + audit
     →  Public site reads latest publication via /api/public/content
```

- **Drafts never leak**: the public endpoint only reads `cms_publications`; the draft endpoint requires a Clerk token + `cms_users` row.
- **Restore** writes a snapshot back into drafts (new unpublished state) and logs a new version — history is append-only.
- **Media**: direct-to-Cloudinary signed uploads; only URLs + metadata live in Postgres.

## 8. Adding a future editable section

1. Add the copy to `db/seed.sql` as a `page_sections` row (or a new table + resource entry in `api/cms/[resource].js` for collections).
2. Run `npm run db:migrate`.
3. Extend `js/cms-content.js` `apply()` with the new selectors (text-only via `textContent`).
4. If it’s a homepage block, add a `sectionCard(c, '<page>', ['<key>'], '<Plain label>')` call in `manage.js`.

## 9. Security checklist (already implemented)

- Clerk JWT verified server-side on every `/api/cms/*` call (`verifyToken` + `cms_users` role check, 401/403 otherwise).
- Zod validation + plain-text sanitization on all mutations; `textContent`-only rendering on public pages.
- Secrets (`CLERK_SECRET_KEY`, `DATABASE_URL`, Cloudinary secret) never leave the server; `/api/public/config` exposes only the publishable key + cloud name.
- Best-effort per-instance rate limiting on API routes; `noindex` on `/manage`; `nosniff` + `no-store` on API responses.
