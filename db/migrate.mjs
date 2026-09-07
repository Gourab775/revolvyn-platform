// ─── REVOLVYN CMS — database migration runner (Neon, zero-build) ──────────
// Usage:
//   $env:DATABASE_URL="postgresql://..." ; npm run db:migrate   (PowerShell)
//   DATABASE_URL="postgresql://..." npm run db:migrate           (bash)
// Runs db/schema.sql then db/seed.sql using Neon's HTTP driver (no pg needed).
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = neon(connectionString);

for (const file of ['schema.sql', 'seed.sql']) {
  const raw = readFileSync(join(dir, file), 'utf8');
  // Split on semicolons at line end boundaries, ignoring those inside
  // dollar-quoted function bodies (schema trigger) — run per statement.
  const statements = splitStatements(raw).filter((s) => s.trim().length > 0);
  console.log(`→ ${file}: ${statements.length} statements`);
  for (const stmt of statements) {
    await sql(stmt);
  }
  console.log(`✓ ${file} applied`);
}

console.log('Done. Schema + seed are up to date.');

function splitStatements(raw) {
  // Strip line comments, then split on ";" except inside $$...$$ blocks.
  const lines = raw.split('\n').filter((l) => !l.trimStart().startsWith('--'));
  const text = lines.join('\n');
  const parts = [];
  let current = '';
  let inDollar = false;
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith('$$', i)) {
      inDollar = !inDollar;
      current += '$$';
      i++;
      continue;
    }
    if (text[i] === ';' && !inDollar) {
      parts.push(current);
      current = '';
      continue;
    }
    current += text[i];
  }
  if (current.trim()) parts.push(current);
  return parts;
}
