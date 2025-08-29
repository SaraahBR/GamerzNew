import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_db';
import { json, parseCookies, setCookie, shouldUseSecureCookie } from '../_http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sid = parseCookies(req)['gn_session'];
  if (sid) {
    await sql/*sql*/`delete from sessions where id = ${sid}`;
    const secure = shouldUseSecureCookie(req);
    setCookie(res, 'gn_session', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure,       
      maxAge: 0,  
    });
  }
  return json(res, { ok: true });
}
