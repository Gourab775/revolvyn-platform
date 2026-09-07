// Shared auth + safety helpers for CMS API routes.
// Every mutation route MUST call requireCmsUser(req) — never trust the client.
import { verifyToken } from '@clerk/backend';
import { db } from './db.js';

export function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function friendly(status, message) {
  const err = new Error(message);
  err.status = status;
  err.publicMessage = message;
  return err;
}

export function handleError(res, err) {
  console.error('[cms-api]', err);
  const status = err.status || 500;
  const message =
    err.publicMessage ||
    (status === 401
      ? 'Please sign in again to continue.'
      : status === 403
        ? 'This account does not have access to the CMS.'
        : status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Something went wrong. Your changes were not saved. Please try again.');
  send(res, status, { error: message });
}

// Best-effort per-instance rate limit (Vercel isolates instances; combined
// with Clerk auth this is a reasonable guard for mutation endpoints).
const hits = new Map();
export function rateLimit(req, { windowMs = 60_000, max = 60 } = {}) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const key = `${ip}:${req.url}`;
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  hits.set(key, entry);
  if (entry.count > max) {
    throw friendly(429, 'Too many requests. Please wait a moment and try again.');
  }
}

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function requireCmsUser(req, { roles = ['owner', 'editor'] } = {}) {
  if (!process.env.CLERK_SECRET_KEY) {
    throw friendly(500, 'Something went wrong. Your changes were not saved. Please try again.');
  }
  const token = bearerToken(req);
  if (!token) throw friendly(401, 'Please sign in again to continue.');

  let session;
  try {
    session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    throw friendly(401, 'Please sign in again to continue.');
  }
  const clerkUserId = session.sub;
  if (!clerkUserId) throw friendly(401, 'Please sign in again to continue.');

  const sql = db();
  const rows = await sql`SELECT * FROM cms_users WHERE clerk_user_id = ${clerkUserId} LIMIT 1`;
  const user = rows[0];
  if (!user) throw friendly(403, 'This account does not have access to the CMS.');
  if (!roles.includes(user.role)) throw friendly(403, 'This account does not have access to the CMS.');
  return { clerkUserId, user };
}

export async function audit(actorClerkId, action, entityType = '', entityId = '', meta = {}) {
  try {
    const sql = db();
    await sql`INSERT INTO audit_logs (actor_clerk_id, action, entity_type, entity_id, meta)
              VALUES (${actorClerkId}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(meta)})`;
  } catch (err) {
    console.error('[audit]', err);
  }
}

// Plain-text sanitizer: CMS stores text, never raw HTML. Strips tags,
// javascript: URLs and event handlers from any string field.
export function cleanText(value, max = 5000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, max);
}

export function cleanUrl(value, max = 2000) {
  const v = cleanText(value, max).trim();
  if (!v) return '';
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(v) && !/^[a-z0-9/._-]+\.html?(#.*)?$/i.test(v) && v !== '#') {
    // Allow relative asset paths (brand logos/..., videos/...) and page links.
    if (/^[a-z0-9 _/().-]+$/i.test(v)) return v;
    return '';
  }
  return v;
}

// Deep sanitizer for JSONB payloads (section blocks, stats, steps, link
// lists…). Strings are cleaned, numbers/booleans pass through, nesting is
// depth-limited. Never throws on unexpected shapes.
export function deepClean(value, max = 2000, depth = 0) {
  if (typeof value === 'string') return cleanText(value, max);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth > 4 || value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.slice(0, 60).map((v) => deepClean(v, max, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 60)) {
      const key = cleanText(k, 80);
      if (key) out[key] = deepClean(v, max, depth + 1);
    }
    return out;
  }
  return null;
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    send(res, 405, { error: 'Something went wrong. Please try again.' });
    return false;
  }
  return true;
}
