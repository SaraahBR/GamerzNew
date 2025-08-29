import type { VercelRequest, VercelResponse } from '@vercel/node';

const ITAD_KEY = process.env.ITAD_API_KEY!;
const BASE = 'https://api.isthereanydeal.com';

const SHOPS = [
  'steam', 'gog', 'humblestore', 'fanatical',
  'greenmangaming', 'epic', 'indiegala', 'nuuvem'
];

function cleanTitle(q: string) {
  // remove acentos, símbolos e espaços extras
  return q
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[\u2019'’"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function itadFetch(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(BASE + path);
  url.searchParams.set('key', ITAD_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
  if (!r.ok) {
    throw new Error(`ITAD ${path} ${r.status}`);
  }
  return r.json();
}

async function resolvePlain(title: string): Promise<string | null> {
  // tenta busca direta
  const trySearch = async (q: string) => {
    const data = await itadFetch('/v02/search/search/', { q, limit: 6 });
    const list = data?.data ?? [];
    if (!Array.isArray(list) || !list.length) return null;

    // 1) match exato (case-insensitive)
    const exact = list.find((x: any) => (x.title || '').toLowerCase() === q.toLowerCase());
    if (exact?.plain) return exact.plain;

    // 2) primeiro resultado
    return list[0]?.plain ?? null;
  };

  // original
  let plain = await trySearch(title);
  if (plain) return plain;

  // limpo
  const cleaned = cleanTitle(title);
  if (cleaned && cleaned !== title) {
    plain = await trySearch(cleaned);
    if (plain) return plain;
  }

  // heurística simples: remover subtítulo entre parênteses
  const noParen = cleaned.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (noParen && noParen !== cleaned) {
    plain = await trySearch(noParen);
    if (plain) return plain;
  }

  return null;
}

function mapPrices(pricesData: any, plain: string) {
  const node = pricesData?.data?.[plain];
  const list: any[] = Array.isArray(node?.list) ? node.list : [];
  return list
    .filter((x) => !!x?.price_new && !!x?.shop?.id)
    .map((x) => ({
      store: x.shop?.name || x.shop?.id,
      price: Number(x.price_new),
      regular: x.price_old ? Number(x.price_old) : null,
      cut: Number(x.price_cut ?? 0),
      currency: (x?.currency ?? 'BRL').toUpperCase(),
      url: x?.url ?? x?.urls?.buy ?? '#',
    }))
    // ordena por preço (asc)
    .sort((a, b) => a.price - b.price);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = String(req.query.q || '').trim();
    if (!ITAD_KEY) {
      return res.status(500).json({ error: 'ITAD_API_KEY ausente no ambiente' });
    }
    if (!q) {
      return res.status(400).json({ error: 'Parâmetro q obrigatório' });
    }

    // parâmetros opcionais
    const country = String(req.query.country || 'BR').toUpperCase(); // BR por padrão
    const region  = String(req.query.region  || 'us').toLowerCase(); // ITAD usa us/eu/uk/ru
    const shops   = String(req.query.shops || SHOPS.join(','));

    const debug = req.query.debug === '1';

    // 1) resolve plain
    const plain = await resolvePlain(q);

    if (!plain) {
      return res.status(200).json({ title: q, plain: null, offers: [], debug: debug ? { note: 'plain não encontrado' } : undefined });
    }

    // 2) busca preços
    const prices = await itadFetch('/v01/game/prices/', {
      plains: plain,
      region,
      country,
      shops,
    });

    const offers = mapPrices(prices, plain);

    if (debug) {
      return res.status(200).json({
        title: q, plain, offers,
        debug: { country, region, shops, raw: prices?.data?.[plain] ?? null }
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ title: q, plain, offers });

  } catch (e: any) {
    return res.status(200).json({ error: e?.message || 'ITAD proxy error', offers: [] });
  }
}
