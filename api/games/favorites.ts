export const config = { runtime: 'nodejs' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { json } from '../_http';
import { requireUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return json(res, { error: 'method_not_allowed' }, { status: 405 });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const rows = await sql/*sql*/`
    select game_id
    from favorites
    where user_id = ${user.id}
  ` as { game_id: number }[];

  json(res, { ids: rows.map(r => r.game_id) });
}
