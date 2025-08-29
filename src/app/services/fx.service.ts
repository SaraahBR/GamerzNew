import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, shareReplay, of, retry, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FxService {
  private readonly key = 'fx_usd_brl_v1';
  private readonly ttlMs = 12 * 60 * 60 * 1000; 
  private usdToBrlObs?: Observable<number>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  usdToBrl$(): Observable<number> {
    if (this.usdToBrlObs) return this.usdToBrlObs;

    // tenta cache (somente browser)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) {
          const { value, ts } = JSON.parse(raw);
          if (Date.now() - ts < this.ttlMs) return of(Number(value));
        }
      } catch {}
    }

    // busca taxa
    this.usdToBrlObs = this.http
      .get<{ rates: { BRL: number } }>('https://api.exchangerate.host/latest?base=USD&symbols=BRL')
      .pipe(
        retry({ count: 2, delay: i => timer(300 * 2 ** i) }),
        map(r => r?.rates?.BRL ?? 5), 
        shareReplay({ bufferSize: 1, refCount: true })
      );

    // persiste quando chegar
    if (isPlatformBrowser(this.platformId)) {
      this.usdToBrlObs.subscribe(v => {
        try { localStorage.setItem(this.key, JSON.stringify({ value: v, ts: Date.now() })); } catch {}
      });
    }

    return this.usdToBrlObs;
  }
}
