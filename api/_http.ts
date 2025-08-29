import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Descobre a base URL a partir dos headers (funciona local/Vercel) */
export function getBaseUrl(
  req: Pick<VercelRequest, 'headers'> | { headers: Record<string, unknown> }
): string {
  const h = (req as any)?.headers ?? {};
  const proto =
    (h['x-forwarded-proto'] as string | undefined) ??
    (h['X-Forwarded-Proto'] as string | undefined) ??
    'http';
  const host =
    (h['x-forwarded-host'] as string | undefined) ??
    (h['host'] as string | undefined) ??
    '';
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL ?? 'https://gamerz-new.vercel.app/'; // mude de acordo com o http/https local/produção
}

export function isSafeRelative(p: unknown): p is string {
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');
}

export function shouldUseSecureCookie(
  req: Pick<VercelRequest, 'headers'> | { headers?: any }
): boolean {
  const h = (req as any)?.headers ?? {};
  const proto =
    (h['x-forwarded-proto'] as string | undefined) ??
    (h['X-Forwarded-Proto'] as string | undefined) ??
    '';
  const host =
    (h['x-forwarded-host'] as string | undefined) ??
    (h['host'] as string | undefined) ??
    '';

  if (!host) return false;
  if (host.startsWith('localhost') || host.startsWith('127.')) return false;
  return proto === 'https';
}

type CookieOpts = {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  domain?: string;
};

/** Define cookie no Vercel Node runtime */
export function setCookie(
  res: VercelResponse,
  name: string,
  value: string,
  opts: CookieOpts = {}
): void {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  parts.push(`Path=${opts.path ?? '/'}`);

  if (opts.httpOnly ?? true) parts.push('HttpOnly');

  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`);

  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);

  const prev = res.getHeader('Set-Cookie');
  const list = Array.isArray(prev) ? prev.slice() : prev ? [String(prev)] : [];
  list.push(parts.join('; '));
  res.setHeader('Set-Cookie', list);
}

/** Responde JSON no Vercel Node */
export function json(
  res: VercelResponse,
  data: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): void {
  if (init?.status) res.status(init.status);
  if (init?.headers) {
    for (const [k, v] of Object.entries(init.headers)) {
      res.setHeader(k, v);
    }
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/** Lê e parseia o header Cookie (Headers Web API e Node/Vercel) */
export function parseCookies(
  source:
    | VercelRequest
    | { headers?: any }
    | Headers
    | Record<string, string | string[] | undefined>
): Record<string, string> {
  const headers =
    source instanceof Headers
      ? source
      : ((source as any)?.headers ?? source) as any;

  let raw = '';
  if (headers instanceof Headers) {
    raw = headers.get('cookie') ?? '';
  } else {
    const c = (headers?.cookie ?? headers?.Cookie) as
      | string
      | string[]
      | undefined;
    raw = Array.isArray(c) ? c.join('; ') : c ?? '';
  }

  const out: Record<string, string> = {};
  if (!raw) return out;

  for (const part of raw.split(';')) {
    const [k, ...v] = part.split('=');
    const key = (k ?? '').trim();
    if (!key) continue;
    out[key] = decodeURIComponent((v.join('=') ?? '').trim());
  }
  return out;
}

export const getCookies = parseCookies;
