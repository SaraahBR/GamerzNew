import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { json } from '../_http';

export const config = { runtime: 'nodejs' };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const rows = await sql/*sql*/`
    select id, title, img, genre, year, dev, pub, description, steam
    from games
    order by id desc
    limit 100
  `;
  return json(res, { items: rows });
}
