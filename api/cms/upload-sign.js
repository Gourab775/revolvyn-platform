// POST /api/cms/upload-sign — sign a direct-to-Cloudinary upload.
// The browser uploads the file straight to Cloudinary; the secret never
// leaves the server. Large binaries never touch Postgres (only URLs stored).
import crypto from 'node:crypto';
import { send, handleError, requireCmsUser, rateLimit, method, friendly } from '../_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['POST'])) return;
    rateLimit(req, { max: 30 });
    await requireCmsUser(req);

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw friendly(400, 'File uploads are not set up yet. You can paste an image or video link instead.');
    }
    const folder = typeof req.body?.folder === 'string' ? req.body.folder.replace(/[^a-z-]/g, '').slice(0, 40) : 'revolvyn';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest('hex');
    send(res, 200, {
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
    });
  } catch (err) {
    handleError(res, err);
  }
}
