export const config = { runtime: 'nodejs' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_db';
import { json, parseCookies } from '../../_http';

async function getUserId(req: VercelRequest): Promise<string | null> {
  const sid = parseCookies(req)['gn_session'];
  if (!sid) return null;
  const rows = await sql/*sql*/`
    select u.id
    from sessions s
    join users u on u.id = s.user_id
    where s.id = ${sid}
    limit 1
  `;
  return rows[0]?.id ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUserId(req);
    if (!uid) return json(res, { error: 'login_required' }, { status: 401 });

    const rows = await sql/*sql*/`
      select id, title, img, genre, year, dev, pub, description, steam, favorite
      from custom_games
      where user_id = ${uid}
      order by title asc
    `;
    return json(res, { items: rows });
  } catch (e) {
    console.error('custom/list error:', e);
    return json(res, { error: 'internal_error' }, { status: 500 });
  }
}
