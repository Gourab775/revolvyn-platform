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
