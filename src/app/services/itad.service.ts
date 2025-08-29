import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Game } from '../pages/jogos/games.data';

export type ItadOffer = {
  storeId?: string;
  store: string;
  price: number;
  currency: string;
  regular: number | null;
  cut: number;
  url: string | null;
  voucher?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ItadService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<ItadOffer[]>>();

  /** Extrai appid de uma URL/valor da Steam (ex.: .../app/1245620/ELDEN_RING/) */
  private extractAppId(input?: string | number): number | undefined {
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    const s = String(input || '');
    const m =
      s.match(/\/app\/(\d+)/i) ||
      s.match(/\bappid=(\d+)/i) ||
      s.match(/\b(\d{3,})\b/);
    return m ? Number(m[1]) : undefined;
  }

  private cacheKey(params: {
    title?: string;
    appid?: number;
    country?: string;
    shops?: string;
  }): string {
    return [
      `t=${(params.title || '').trim().toLowerCase()}`,
      `a=${params.appid ?? ''}`,
      `c=${params.country ?? ''}`,
      `s=${params.shops ?? ''}`,
    ].join('|');
  }

  private fetchOffers(params: {
    title?: string;
    appid?: number;
    steam?: string;
    country?: 'BR' | 'US';
    shops?: string;
  }): Observable<ItadOffer[]> {
    const appid = params.appid ?? this.extractAppId(params.steam);

    let httpParams = new HttpParams();
    if (params.title)  httpParams = httpParams.set('q', params.title);
    if (appid)         httpParams = httpParams.set('appid', String(appid));
    if (params.country)httpParams = httpParams.set('country', params.country);
    if (params.shops)  httpParams = httpParams.set('shops', params.shops);

    const key = this.cacheKey({
      title: params.title,
      appid,
      country: params.country,
      shops: params.shops,
    });

    if (!this.cache.has(key)) {
      const req$ = this.http
        .get<{ offers: any[] }>('/api/itad', { params: httpParams })
        .pipe(
          map(res =>
            (res?.offers ?? [])
              .map(o => ({
                storeId: (o as any).storeId, 
                store: o.store,
                price: Number(o.price),
                currency: o.currency,
                regular: o.regular ?? null,
                cut: o.cut ?? 0,
                url: o.url ?? null,
                voucher: o.voucher ?? undefined,
              }) as ItadOffer)
              .sort((a, b) => a.price - b.price)
          ),
          shareReplay({ bufferSize: 1, refCount: true })
        );
      this.cache.set(key, req$);
    }

    return this.cache.get(key)!;
  }


  /** Ofertas por título */
  offersByTitle(
    title: string,
    opts?: { country?: 'BR' | 'US'; shops?: string }
  ): Observable<ItadOffer[]> {
    return this.fetchOffers({ title, country: opts?.country, shops: opts?.shops });
  }

  /** Melhor oferta (menor preço) por título */
  bestOffer(
    title: string,
    opts?: { country?: 'BR' | 'US'; shops?: string }
  ): Observable<ItadOffer | null> {
    return this.offersByTitle(title, opts).pipe(
      map(list => (list.length ? list[0] : null))
    );
  }

  /** Use quando você tiver o objeto do jogo (ex.: com game.steam) */
  offersForGame(
    game: Pick<Game, 'title' | 'steam'>,
    opts?: { country?: 'BR' | 'US'; shops?: string }
  ): Observable<ItadOffer[]> {
    const appid = this.extractAppId(game?.steam);
    return this.fetchOffers({
      title: game?.title ?? '',
      appid,
      steam: game?.steam,
      country: opts?.country,
      shops: opts?.shops,
    });
  }

  /** Melhor oferta usando o objeto do jogo (preferindo appid) */
  bestOfferForGame(
    game: Pick<Game, 'title' | 'steam'>,
    opts?: { country?: 'BR' | 'US'; shops?: string }
  ): Observable<ItadOffer | null> {
    return this.offersForGame(game, opts).pipe(
      map(list => (list.length ? list[0] : null))
    );
  }

  /** Útil em casos de logout/swap de usuário */
  clearCache(): void {
    this.cache.clear();
  }
}
