import type { VercelRequest, VercelResponse } from '@vercel/node';

const API = 'https://api.isthereanydeal.com';

type Identified = { id: string; title: string } | null;
type Offer = {
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

  const title = String(req.query.q || '').trim();
  const appid = req.query.appid ? Number(req.query.appid) : undefined;
  const shops = typeof req.query.shops === 'string' ? req.query.shops : undefined;

  if (!title && !appid) return res.status(400).json({ error: 'Passe q (título) ou appid' });

  try {
    // 1) identificar jogo 
    const game = await identify({ key, title, appid });
    if (!game) {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
      return res.status(200).json({ title, id: null, countryTried: ['BR','US'], offers: [] });
    }

    // 2) preços com fallback BR -> US
    const br = await overview({ key, id: game.id, country: 'BR', shops });
    const us = br.length ? [] : await overview({ key, id: game.id, country: 'US', shops });
    const country = br.length ? 'BR' : 'US';
    const offers = (br.length ? br : us).sort((a, b) => a.price - b.price);

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({ title: game.title, id: game.id, country, offers });
  } catch (e: any) {
    return res.status(200).json({ title, id: null, offers: [], error: String(e?.message || e) });
  }
}

async function identify({ key, title, appid }: { key: string; title?: string; appid?: number }): Promise<Identified> {
  // a) lookup por appid 
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

  // b) lookup por title 
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

  // c) fallback: search (lista) e pega primeiro do tipo "game"
  {
    const u = new URL('/games/search/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('title', title);
    u.searchParams.set('results', '10');
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const list = (await r.json()) as any[];
    const game = list.find(x => x.type === 'game') || list[0];
    if (!game) return null;
    return { id: game.id, title: game.title };
  }
}

async function overview({
  key, id, country, shops,
}: { key: string; id: string; country: 'BR' | 'US'; shops?: string }): Promise<Offer[]> {
  const u = new URL('/games/overview/v2', API);
  u.searchParams.set('key', key);
  u.searchParams.set('country', country);
  u.searchParams.set('vouchers', 'true');
  if (shops) u.searchParams.set('shops', shops);

  const r = await fetch(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([id]),
  });
  if (!r.ok) return [];

  const j = await r.json() as any;
  const item = j?.prices?.find((p: any) => p.id === id);
  const deals = (item?.deals ?? []) as any[];

  return deals
    .map((d: any): Offer | null => {
      const price = d?.price?.value;
      const currency = d?.price?.currency;
      const store = d?.shop?.name;
      if (price == null || !currency || !store) return null;
      return {
        store,
        price,
        currency,
        regular: d?.deal?.regular?.value ?? null,
        cut: d?.deal?.cut ?? 0,
        url: d?.deal?.url ?? null,
        voucher: d?.deal?.voucher ?? null,
      };
    })
    .filter(Boolean) as Offer[];
}
