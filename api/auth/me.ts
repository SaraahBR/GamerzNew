import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { json, parseCookies } from '../_http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sid = parseCookies(req)['gn_session'];
  if (!sid) return json(res, { user: null });

  const rows = await sql/*sql*/`
    select u.id, u.email, u.name
    from sessions s
    join users u on u.id = s.user_id
    where s.id = ${sid}
      and now() < s.created_at + (s.ttl_sec * interval '1 second')
    limit 1
  `;
  const user = rows[0] || null;
  return json(res, { user });
}
