// Shared Neon client for Vercel serverless functions (HTTP, no pools needed).
import { neon } from '@neondatabase/serverless';

let client = null;

export function db() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('Server is not configured (missing DATABASE_URL).');
    err.status = 500;
    err.publicMessage = 'Something went wrong. Your changes were not saved. Please try again.';
    throw err;
  }
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

// Parameterized dynamic queries for the installed driver, which exposes
// only the tagged-template call (no .query/.unsafe). `text` uses $1..$n
// placeholders in order; table/column names must come from an allowlist,
// never from user input (values are separately validated + sanitized).
export function unsafe(sql, text, params = []) {
  const parts = text.split(/\$\d+/);
  if (parts.length - 1 !== params.length) {
    throw new Error('Parameter count mismatch');
  }
  return sql(parts, ...params);
}
