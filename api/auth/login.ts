import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { sql } from '../_db';
import { json, setCookie } from '../_http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, { status: 405 });

  const body = typeof req.body === 'object' ? req.body : JSON.parse(String(req.body || '{}'));
  const email = String(body.email || '').trim().toLowerCase();
  const name  = body.name ? String(body.name).trim() : null;
  if (!email) return json(res, { error: 'email required' }, { status: 400 });

  // upsert por email
  const rows = await sql/*sql*/`
    insert into users (email, name)
    values (${email}, ${name})
    on conflict (email) do update
      set name = coalesce(excluded.name, users.name)
    returning id, email, name
  `;
  const user = rows[0];

  // cria sessão (7 dias)
  const sid = randomUUID();
  await sql/*sql*/`
    insert into sessions (id, user_id, created_at, ttl_sec)
    values (${sid}, ${user.id}, now(), 604800)
  `;

  // cookie httpOnly
  setCookie(res, 'gn_session', sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 604800,
  });

  return json(res, { user });
}
