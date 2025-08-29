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

/** ------------ Utils de normalização e scoring ------------ */
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, ' ')     // tudo que não for a-z/0-9 vira espaço
    .trim();

function looksLikeSameTitle(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

function softMatchScore(needle: string, hay: string): number {
  const n = norm(needle);
  const h = norm(hay);
  if (n === h) return 100;
  if (h.startsWith(n)) return 90;
  if (h.includes(n)) return 75;
  // bônus por compartilhar muitas palavras
  const nWords = new Set(n.split(' ').filter(Boolean));
  const hWords = new Set(h.split(' ').filter(Boolean));
  let common = 0;
  nWords.forEach(w => { if (hWords.has(w)) common++; });
  return 50 + Math.min(20, common * 5); // 50..70
}

function extractSteamAppId(input?: string | number): number | undefined {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const s = String(input || '');
  const m = s.match(/\/app\/(\d+)/i) || s.match(/\bappid=(\d+)/i) || s.match(/\b(\d{3,})\b/);
  return m ? Number(m[1]) : undefined;
}

/** ------------ Handler ------------ */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.ITAD_API_KEY;
  if (!key) return res.status(500).json({ error: 'ITAD_API_KEY não configurada' });

  // aceita q= ou title=
  const titleRaw = (req.query.q ?? req.query.title ?? '') as string;
  const title = String(titleRaw || '').trim();

  // aceita appid= (número) e/ou steam= (URL)
  const appidFromQuery = req.query.appid ? Number(req.query.appid) : undefined;
  const appid = extractSteamAppId(appidFromQuery || (req.query.steam as string));

  // aceita override de país e lojas (opcionais)
  const countryParam = (req.query.country as string)?.toUpperCase();
  const preferredCountries: Array<'BR' | 'US'> = (countryParam === 'US' || countryParam === 'BR')
    ? [countryParam as 'BR' | 'US']
    : ['BR', 'US'];

  const shops = typeof req.query.shops === 'string' ? req.query.shops : undefined;

  if (!title && !appid) {
    return res.status(400).json({ error: 'Passe q (title) ou appid (ou steam)' });
  }

  try {
    // 1) identificar jogo (prioriza appid)
    const game = await identify({ key, title, appid });
    if (!game) {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
      return res.status(200).json({
        title,
        id: null,
        countryTried: preferredCountries,
        offers: [],
        debug: { reason: 'identify_failed' }
      });
    }

    // 2) preços com fallback BR -> US (ou país escolhido)
    let offers: Offer[] = [];
    let country: 'BR' | 'US' = preferredCountries[0];

    for (const c of preferredCountries) {
      const list = await overview({ key, id: game.id, country: c, shops });
      if (list.length) {
        offers = list.sort((a, b) => a.price - b.price);
        country = c;
        break;
      }
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({
      title: game.title,
      id: game.id,
      country,
      offers,
      ...(offers.length === 0 ? { debug: { triedCountries: preferredCountries } } : {})
    });
  } catch (e: any) {
    return res.status(200).json({
      title,
      id: null,
      offers: [],
      error: String(e?.message || e)
    });
  }
}

/** ------------ Identify ------------ */
async function identify({
  key, title, appid
}: { key: string; title?: string; appid?: number }): Promise<Identified> {

  // a) lookup direto por appid (Steam)
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

  // Normaliza casos como "EldenRing" -> "Elden Ring"
  const titleForLookup = title
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // b) lookup por title (pode acertar de primeira)
  {
    const u = new URL('/games/lookup/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('title', titleForLookup);
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const j = await r.json();
      if (j?.found && j?.game?.id) {
        // se for match exato (normalizado), confia
        if (looksLikeSameTitle(titleForLookup, j.game.title)) {
          return { id: j.game.id, title: j.game.title };
        }
        // senão, continua para a busca com ranking
      }
    }
  }

  // c) fallback: search (lista) e escolhe o melhor candidato do tipo "game"
  {
    const u = new URL('/games/search/v1', API);
    u.searchParams.set('key', key);
    u.searchParams.set('title', titleForLookup);
    u.searchParams.set('results', '20');

    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;

    const list = (await r.json()) as any[];
    const games = list.filter(x => x?.type === 'game');

    if (!games.length) return null;

    // tenta primeiro um match "exato" normalizado
    const exact = games.find(x => looksLikeSameTitle(titleForLookup, x.title));
    if (exact?.id) return { id: exact.id, title: exact.title };

    // caso contrário, usa score de similaridade
    games.sort((a, b) => softMatchScore(titleForLookup, b.title) - softMatchScore(titleForLookup, a.title));
    const best = games[0];
    return best?.id ? { id: best.id, title: best.title } : null;
  }
}

/** ------------ Overview ------------ */
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

  // A resposta traz uma lista "prices"; procure o item do id
  const item = Array.isArray(j?.prices)
    ? j.prices.find((p: any) => p?.id === id)
    : null;

  const deals = Array.isArray(item?.deals) ? item.deals : [];

  // Algumas respostas variam um pouco de forma; faça parsing defensivo
  const parsed: Offer[] = deals.map((d: any) => {
    const store = d?.shop?.name ?? d?.shop?.id ?? d?.store ?? null;

    // possíveis locais de preço/currency
    const priceValue =
      d?.price?.value ??
      d?.deal?.price?.value ??
      d?.price_new ??
      null;

    const currency =
      d?.price?.currency ??
      d?.deal?.price?.currency ??
      d?.currency ??
      null;

    // preço "regular" (antes do desconto), quando existir
    const regularValue =
      d?.deal?.regular?.value ??
      d?.price_old ??
      null;

    // calcula o corte (cut) se não vier
    const cut =
      d?.deal?.cut ??
      (priceValue != null && regularValue
        ? Math.max(0, Math.round(100 - (priceValue / regularValue) * 100))
        : 0);

    const url = d?.deal?.url ?? d?.url ?? null;
    const voucher = d?.deal?.voucher ?? d?.voucher ?? null;

    if (store && priceValue != null && currency) {
      return {
        store,
        price: Number(priceValue),
        currency: String(currency),
        regular: regularValue != null ? Number(regularValue) : null,
        cut: Number.isFinite(cut) ? Number(cut) : 0,
        url: url ? String(url) : null,
        voucher: voucher ? String(voucher) : null,
      };
    }
    return null;
  }).filter(Boolean) as Offer[];

  return parsed;
}
