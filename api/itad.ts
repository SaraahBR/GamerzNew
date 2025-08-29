type ItadPlainRes = { data?: { plain?: string } };
type ItadPricesRes = { data?: Record<string, { list?: any[] }> };

const SHOPS = [
  'steam', 'gog', 'epic', 'humblestore', 'fanatical', 'greenmangaming', 'gamersgate'
].join(',');

export default async function handler(req: any, res: any) {
  const key = process.env.ITAD_API_KEY;
  if (!key) return res.status(500).json({ error: 'ITAD_API_KEY ausente' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'parametro q (title) obrigatório' });

  try {
    // 1) Resolve título então logo plain
    const plainR = await fetch(
      `https://api.isthereanydeal.com/v02/game/plain/?key=${key}&title=${encodeURIComponent(q)}`
    );
    const plainJ = (await plainR.json()) as ItadPlainRes;
    const plain = plainJ?.data?.plain;
    if (!plain) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.json({ title: q, plain: null, offers: [] });
    }

    // 2) Preços (filtra lojas e região BR)
    const pricesR = await fetch(
      `https://api.isthereanydeal.com/v01/game/prices/?key=${key}&plains=${plain}&region=br&country=BR&shops=${SHOPS}`
    );
    const pricesJ = (await pricesR.json()) as ItadPricesRes;

    const keyPlain = Object.keys(pricesJ?.data || {})[0];
    const list = (pricesJ?.data?.[keyPlain]?.list || []) as any[];

    const offers = list.map((o: any) => {
      // ITAD envia:
      // o.shop.id / o.shop.name
      // o.price.amount / o.price.currency
      // o.regular.amount (preço cheio)
      // o.cut (desconto %)
      const price = Number(o?.price?.amount ?? o?.price_new ?? o?.price ?? 0);
      const regular = Number(o?.regular?.amount ?? o?.price_old ?? 0);
      const cut = Number(o?.cut ?? (regular > 0 ? ((regular - price) / regular) * 100 : 0));
      return {
        storeId: String(o?.shop?.id || ''),
        store: String(o?.shop?.name || 'Loja'),
        price,
        currency: String(o?.price?.currency || 'BRL'),
        regular: regular > 0 ? regular : null,
        cut: Number.isFinite(cut) ? Math.max(0, cut) : 0,
        url: String(o?.url || '#')
      };
    }).filter(o => o.price > 0);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900'); // 5min
    res.json({ title: q, plain, offers });
  } catch (e: any) {
    res.status(500).json({ error: 'itad_proxy_failed', detail: String(e?.message || e) });
  }
}
