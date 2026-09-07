// ─── REVOLVYN CMS — first-owner setup (run by the DEVELOPER, not the UI) ───
// Usage:
//   npm run cms:create-owner -- --clerk-id=user_xxx --email=owner@example.com [--role=owner]
// Env: DATABASE_URL must be set. Never commit credentials.
import { neon } from '@neondatabase/serverless';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  }),
);

const clerkId = args['clerk-id'] || process.env.CMS_FIRST_OWNER_CLERK_ID;
const email = args.email || process.env.CMS_FIRST_OWNER_EMAIL;
const role = args.role || 'owner';

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}
if (!clerkId || !email) {
  console.error('Usage: npm run cms:create-owner -- --clerk-id=user_xxx --email=owner@example.com');
  console.error('Find the Clerk user ID in Clerk Dashboard → Users → click user → User ID.');
  process.exit(1);
}
if (!['owner', 'editor'].includes(role)) {
  console.error('Role must be "owner" or "editor".');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql`
  INSERT INTO cms_users (clerk_user_id, email, role)
  VALUES (${clerkId}, ${email}, ${role})
  ON CONFLICT (clerk_user_id)
  DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, updated_at = NOW()
`;
console.log(`✓ ${email} (${clerkId}) is now authorized as "${role}". They can sign in at /manage.`);
