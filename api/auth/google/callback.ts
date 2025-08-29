export const config = { runtime: 'nodejs' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_db';
import {
  json,
  setCookie,
  getBaseUrl,
  isSafeRelative,
  shouldUseSecureCookie,
} from '../../_http';
import { randomUUID } from 'node:crypto';

type TokenResponse = {
  access_token: string;
  id_token?: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleUser = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code) return json(res, { error: 'missing_code' }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
    if (!clientId || !clientSecret) {
      return json(res, { error: 'missing_google_env' }, { status: 500 });
    }

    const redirectUri = `${getBaseUrl(req as any)}/api/auth/google/callback`;

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!tr.ok)
      return json(res, { error: 'token_exchange_failed' }, { status: 400 });

    const token = (await tr.json()) as TokenResponse;

    const ur = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!ur.ok) return json(res, { error: 'userinfo_failed' }, { status: 400 });

    const g = (await ur.json()) as GoogleUser;
    const email = (g.email || '').toLowerCase();
    const name = g.name || undefined;
    if (!email) return json(res, { error: 'email_not_provided' }, { status: 400 });

    // gera um id para não violar NOT NULL
    const uid = randomUUID();

    // upsert user por email
    const userRow = (await sql`
      insert into users (id, email, name)
      values (${uid}, ${email}, ${name})
      on conflict (email) do update
        set name = excluded.name
      returning id, email, name
    `) as Array<{ id: string; email: string; name: string | null }>;

    const user = userRow[0];

    // cria sessão
    const sid = randomUUID();
    await sql`
      insert into sessions (id, user_id, created_at, ttl_sec, data)
      values (${sid}, ${user.id}, now(), 604800, '{}'::jsonb)
    `;

    const secure = shouldUseSecureCookie(req);
    setCookie(res, 'gn_session', sid, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'Lax',
      secure,        
      path: '/',
    });

    const to = isSafeRelative(state) ? state : '/jogos';
    res.status(302);
    res.setHeader('Location', to);
    res.end();
  } catch (e) {
    console.error('google/callback error:', e);
    return json(res, { error: 'internal_error' }, { status: 500 });
  }
}
