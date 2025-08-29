export const config = { runtime: 'nodejs' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBaseUrl, isSafeRelative } from '../../_http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  if (!clientId) {
    res.status(500);
    return res.send('Missing GOOGLE_CLIENT_ID');
  }

  const base        = getBaseUrl(req);
  const redirectUri = `${base}/api/auth/google/callback`;

  const fromParam =
    typeof req.query.from === 'string' && isSafeRelative(req.query.from)
      ? req.query.from
      : '/jogos';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: fromParam,
  });

  res.status(302);
  res.setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.end();
}
