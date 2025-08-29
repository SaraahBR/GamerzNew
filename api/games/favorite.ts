export const config = { runtime: 'nodejs' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { json } from '../_http';
import { requireUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, { error: 'method_not_allowed' }, { status: 405 });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  // body seguro 
  let body: any = req.body ?? {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const gameId = Number(body.id);
  const value = !!body.value;

  if (!Number.isInteger(gameId)) {
    return json(res, { error: 'invalid_game_id' }, { status: 400 });
  }

  try {
    if (value) {
      await sql/*sql*/`
        insert into favorites (user_id, game_id, created_at)
        values (${user.id}, ${gameId}, now())
        on conflict (user_id, game_id) do nothing
      `;
    } else {
      await sql/*sql*/`
        delete from favorites
        where user_id = ${user.id} and game_id = ${gameId}
      `;
    }
    return json(res, { ok: true });
  } catch (e: any) {
    console.error('favorite error:', e);
    if (e?.code === '23503') {
      return json(res, { error: 'unknown_game_id' }, { status: 400 });
    }
    return json(res, { error: 'internal_error' }, { status: 500 });
  }
}
