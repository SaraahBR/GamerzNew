import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db';
import { parseCookies, json } from './_http';

export type AuthedUser = { id: string; email: string; name: string | null };

export async function getUserFromSession(req: VercelRequest): Promise<AuthedUser | null> {
  const sid = parseCookies(req)['gn_session'];
  if (!sid) return null;

  const rows = await sql/*sql*/`
    select u.id, u.email, u.name
    from sessions s
    join users u on u.id = s.user_id
    where s.id = ${sid}
      and now() < s.created_at + (s.ttl_sec * interval '1 second')
    limit 1
  ` as AuthedUser[];

  return rows[0] ?? null;
}

export async function requireUser(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthedUser | null> {
  const u = await getUserFromSession(req);
  if (!u) {
    json(res, { error: 'login_required' }, { status: 401 });
    return null;
  }
  return u;
}
