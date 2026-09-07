// ─── REVOLVYN CMS — database migration runner (Neon, zero-build) ──────────
// Usage:
//   $env:DATABASE_URL="postgresql://..." ; npm run db:migrate   (PowerShell)
//   DATABASE_URL="postgresql://..." npm run db:migrate           (bash)
// Runs db/schema.sql then db/seed.sql using Neon's HTTP driver (no pg needed).
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = neon(connectionString);

const files = ['schema.sql', 'seed.sql'];
const migDir = join(dir, 'migrations');
if (existsSync(migDir)) {
  for (const m of readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()) {
    files.push('migrations/' + m);
  }
}

for (const file of files) {
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

// Policy: migrations/seeds must never leave draft flags dirty. The
// has_unpublished_changes trigger fires on every UPDATE (needed for CMS
// edits), so any migration UPDATE would otherwise fake "unpublished"
// state. Reset unconditionally at the end of every migrate run.
for (const table of [
  'page_sections',
  'portfolio_items',
  'brands',
  'services',
  'testimonials',
  'site_settings',
]) {
  await sql(`UPDATE ${table} SET has_unpublished_changes = FALSE`);
}
console.log('✓ draft flags reset (migrations leave no phantom edits)');

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
