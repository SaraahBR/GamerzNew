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
  if (req.method !== 'POST') return json(res, { error: 'method_not_allowed' }, { status: 405 });

  try {
    const uid = await getUserId(req);
    if (!uid) return json(res, { error: 'login_required' }, { status: 401 });

    const b = (req.body && typeof req.body === 'object') ? (req.body as any) : {};
    const { title, img, genre, year, dev, pub, description, steam, favorite } = b;

    if (!title || !img || !Array.isArray(genre) || !year || !dev || !pub || !description || !steam) {
      return json(res, { error: 'invalid_payload' }, { status: 400 });
    }

    const rows = await sql/*sql*/`
      insert into custom_games
      (user_id, title, img, genre, year, dev, pub, description, steam, favorite)
      values
      (${uid}, ${title}, ${img}, ${genre}, ${year}, ${dev}, ${pub}, ${description}, ${steam}, ${!!favorite})
      returning id, title, img, genre, year, dev, pub, description, steam, favorite
    `;
    return json(res, { item: rows[0] }, { status: 201 });
  } catch (e) {
    console.error('custom/create error:', e);
    return json(res, { error: 'internal_error' }, { status: 500 });
  }
}
