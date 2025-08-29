import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export type ItadOffer = {
  storeId: string;
  store: string;
  price: number;
  currency: string; 
  regular: number | null;
  cut: number; 
  url: string;
};

@Injectable({ providedIn: 'root' })
export class ItadService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<ItadOffer[]>>();

  /** Ofertas por título (normaliza com o proxy) */
  offersByTitle(title: string): Observable<ItadOffer[]> {
    const key = title.trim().toLowerCase();
    if (!this.cache.has(key)) {
      const req$ = this.http.get<{ offers: ItadOffer[] }>(`/api/itad?q=${encodeURIComponent(title)}`)
        .pipe(
          map(j => (j?.offers || []).sort((a, b) => a.price - b.price)),
          shareReplay({ bufferSize: 1, refCount: true })
        );
      this.cache.set(key, req$);
    }
    return this.cache.get(key)!;
  }

  /** Melhor oferta (menor preço) */
  bestOffer(title: string): Observable<ItadOffer | null> {
    return this.offersByTitle(title).pipe(
      map(list => list.length ? list[0] : null)
    );
  }
}
