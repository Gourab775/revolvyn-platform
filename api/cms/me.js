// GET /api/cms/me — who am I, and am I allowed in? Also logs access.
import { db } from '../_lib/db.js';
import { send, handleError, requireCmsUser, audit, rateLimit, method } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET'])) return;
    rateLimit(req, { max: 120 });
    const { clerkUserId, user } = await requireCmsUser(req);
    await audit(clerkUserId, 'access', 'session', '', { email: user.email });
    send(res, 200, {
      user: { email: user.email, role: user.role, clerkUserId },
      uploadsEnabled: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET,
      ),
    });
  } catch (err) {
    handleError(res, err);
  }
}
