import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, retry, shareReplay, timer } from 'rxjs';

type Store = {
  storeID: string;
  storeName: string;
  images?: { logo?: string; icon?: string; banner?: string };
  isActive?: number;
};

type Deal = {
  dealID: string;
  storeID: string;
  title: string;
  salePrice: string;     
  normalPrice: string;  
  savings?: string;      
  dealRating?: string;
  thumb?: string;
};

@Injectable({ providedIn: 'root' })
export class DealsService {
  private http = inject(HttpClient);
  private base = 'https://www.cheapshark.com/api/1.0';

  /** cache em memória */
  private stores$?: Observable<Record<string, Store>>;
  private dealsCache = new Map<string, Observable<Deal[]>>();

  /** carrega a lista de lojas 1x e transforma em dicionário por id */
  getStores(): Observable<Record<string, Store>> {
    if (!this.stores$) {
      this.stores$ = this.http.get<Store[]>(`${this.base}/stores`).pipe(
        retry({ count: 2, delay: i => timer(300 * 2 ** i) }),
        map(arr => arr.reduce<Record<string, Store>>((acc, s) => (acc[s.storeID] = s, acc), {})),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.stores$;
  }

  /** procura ofertas por título */
  dealsByTitle(title: string): Observable<Deal[]> {
    const key = title.trim().toLowerCase();
    if (!this.dealsCache.has(key)) {
      const url = `${this.base}/deals`;
      const params = {
        title: title,
        pageSize: '40',
        exact: '0'
      };
      const req$ = this.http.get<Deal[]>(url, { params }).pipe(
        retry({ count: 2, delay: i => timer(300 * 2 ** i) }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.dealsCache.set(key, req$);
    }
    return this.dealsCache.get(key)!;
  }

  /** melhor oferta já com loja e link de redirecionamento da CheapShark */
  bestDeal(title: string): Observable<{
    store: string; priceUSD: number; url: string;
    normalUSD: number; savingsPct: number;
  } | null> {
    return this.dealsByTitle(title).pipe(
      map(list => {
        if (!list?.length) return null;
        const sorted = [...list].sort((a, b) => Number(a.salePrice) - Number(b.salePrice));
        const d = sorted[0];
        const savingsPct =
          d.savings ? Number(d.savings) :
          ((Number(d.normalPrice) - Number(d.salePrice)) / Number(d.normalPrice)) * 100;
        return {
          store: d.storeID, 
          priceUSD: Number(d.salePrice),
          normalUSD: Number(d.normalPrice),
          savingsPct: Math.max(0, Number.isFinite(savingsPct) ? savingsPct : 0),
          url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`
        };
      })
    );
  }
}
