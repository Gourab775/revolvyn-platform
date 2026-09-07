// Public config — ONLY safe-to-expose values. No secrets here ever.
import { send, handleError } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    send(res, 200, {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      uploadsEnabled: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET,
      ),
      manageEnabled: Boolean(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
      ),
    });
  } catch (err) {
    handleError(res, err);
  }
}
