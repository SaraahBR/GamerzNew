import type { VercelRequest, VercelResponse } from '@vercel/node';

const API = 'https://api.isthereanydeal.com';

type Identified = { id: string; title: string } | null;

type Offer = {
  storeId?: string;
  store: string;
  price: number;
  currency: string;
  regular: number | null;
  cut: number;
  url: string | null;
  voucher?: string | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.ITAD_API_KEY;
  if (!key) return res.status(500).json({ error: 'ITAD_API_KEY não configurada' });

  const title = String(req.query.q ?? '').trim();
  const appid = req.query.appid ? Number(req.query.appid) : undefined;
  const countryHint = (String(req.query.country ?? '') || '').toUpperCase();
  const shops = typeof req.query.shops === 'string' ? req.query.shops : undefined;
  const dealsOnly = String(req.query.dealsOnly ?? '').toLowerCase() === 'true';
  const debugParam = String(req.query.debug ?? '').toLowerCase() === '1' || String(req.query.debug ?? '').toLowerCase() === 'true';

  if (!title && !appid) return res.status(400).json({ error: 'Passe ?q=<título> ou ?appid=<steam appid>' });

  try {
    // 1) identificar jogo por appid (preferido) ou por título
    const game = await identify({ key, title, appid });
    if (!game) {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
      return res.status(200).json({ title, id: null, country: null, offers: [], debug: { reason: 'not_found' } });
    }

    const triedCountries: string[] = [];
    const order = Array.from(new Set([countryHint || 'BR', 'US']));

    let offers: Offer[] = [];
    let chosenCountry: string | null = null;

    for (const c of order) {
      triedCountries.push(c);
      const list = await pricesV3({ key, id: game.id, country: c as 'BR' | 'US', shops, dealsOnly });
      if (list.length) {
        offers = list;
        chosenCountry = c;
        break;
      }
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({
      title: game.title,
      id: game.id,
      country: chosenCountry,
      offers: offers.sort((a, b) => a.price - b.price),
      debug: debugParam ? { triedCountries } : undefined,
    });
  } catch (e: any) {
    return res.status(200).json({ title, id: null, country: null, offers: [], error: String(e?.message || e) });
  }
}

/** Identifica jogo pelo appid (Steam) ou pelo título */
async function identify({ key, title, appid }: { key: string; title?: string; appid?: number }): Promise<Identified> {
  if (appid) {
    const u = new URL('/games/lookup/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('appid', String(appid));
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const j = await r.json();
      if (j?.found && j?.game?.id) return { id: j.game.id, title: j.game.title };
    }
  }

  if (!title) return null;

  // lookup por título 
  {
    const u = new URL('/games/lookup/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('title', title);
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const j = await r.json();
      if (j?.found && j?.game?.id) return { id: j.game.id, title: j.game.title };
    }
  }

  // fallback: search e pega o primeiro do tipo "game"
  {
    const u = new URL('/games/search/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('title', title);
    u.searchParams.set('results', '10');
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const list = (await r.json()) as any[];
    const g = list.find(x => x.type === 'game') || list[0];
    return g ? { id: g.id, title: g.title } : null;
  }
}

/** Lista de preços/ofertas por loja usando /games/prices/v3 */
async function pricesV3({
  key, id, country, shops, dealsOnly,
}: { key: string; id: string; country: 'BR' | 'US'; shops?: string; dealsOnly?: boolean }): Promise<Offer[]> {
  const u = new URL('/games/prices/v3', API);
  u.searchParams.set('key', key);
  u.searchParams.set('country', country);
  u.searchParams.set('deals', dealsOnly ? 'true' : 'false');
  u.searchParams.set('vouchers', 'true');
  u.searchParams.set('capacity', '30');
  if (shops) u.searchParams.set('shops', shops);

  const r = await fetch(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([id]),
  });
  if (!r.ok) return [];

  const arr = (await r.json()) as any[];
  const item = arr?.find?.((p: any) => p?.id === id);
  const deals = (item?.deals ?? []) as any[];

  return deals
    .map((d: any): Offer | null => {
      const amount = d?.price?.amount;
      const currency = d?.price?.currency;
      const storeName = d?.shop?.name;
      if (amount == null || !currency || !storeName) return null;
      return {
        storeId: d?.shop?.id ?? undefined,
        store: storeName,
        price: Number(amount),
        currency: String(currency),
        regular: d?.regular?.amount != null ? Number(d.regular.amount) : null,
        cut: Number(d?.cut ?? 0),
        url: d?.url ?? null,
        voucher: d?.voucher ?? undefined,
      };
    })
    .filter(Boolean) as Offer[];
}
