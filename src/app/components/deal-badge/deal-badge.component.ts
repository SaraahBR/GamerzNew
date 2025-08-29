import { Component, Input, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { combineLatest, map, of } from 'rxjs';
import { DealsService } from '../../services/deals.service';
import { FxService } from '../../services/fx.service';

@Component({
  selector: 'app-deal-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
  <ng-container *ngIf="ready; else skeleton">
    <a *ngIf="vm$ | async as vm; else nooffer"
       class="deal-badge"
       [href]="vm.url"
       target="_blank" rel="noopener"
       [attr.aria-label]="'Melhor preço: ' + (vm.priceBRL | currency:'BRL':'symbol':'1.2-2':'pt-BR') + ' na ' + vm.storeName">
      <span class="from">a&nbsp;partir&nbsp;de</span>
      <strong class="price">{{ vm.priceBRL | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
      <span class="store">• {{ vm.storeName }}</span>

      <!-- Tooltip -->
      <span class="tip" role="tooltip">
        Economia ~{{ vm.savingsPct | number:'1.0-0':'pt-BR' }}%
        <small class="muted">
          normal: {{ vm.normalBRL | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
        </small>
      </span>
    </a>
  </ng-container>

  <ng-template #nooffer>
    <span class="deal-badge muted">sem ofertas no momento</span>
  </ng-template>

  <ng-template #skeleton>
    <span class="deal-badge shimmer" aria-hidden="true"></span>
  </ng-template>
  `,
  styles: [`
  .deal-badge{
    position:relative;
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 10px; border-radius:999px; border:1px solid #ef9ab2;
    background:#fff; color:#8b2d47; text-decoration:none; font-weight:700;
    box-shadow: 0 4px 12px rgba(255,105,130,.18);
    transition: transform .12s ease, box-shadow .12s ease;
    white-space: nowrap;
  }
  .deal-badge:hover{ transform: translateY(-1px); box-shadow:0 6px 16px rgba(255,105,130,.22);}
  .deal-badge.muted{ opacity:.75; border-style:dashed; }
  .from{ font-weight:600; opacity:.9; }
  .price{ font-weight:800; letter-spacing:.3px; }
  .store{ font-weight:700; opacity:.85; }

  /* Tooltip */
  .tip{
    position:absolute; inset:auto auto 100% 50%;
    transform: translate(-50%, -8px);
    background:#1f2937; color:#fff; border-radius:10px;
    padding:8px 10px; font-weight:700; font-size:12px;
    opacity:0; pointer-events:none; transition:opacity .12s ease, transform .12s ease;
    box-shadow:0 8px 18px rgba(0,0,0,.35);
    text-align:center; min-width: 190px;
  }
  .tip::after{
    content:""; position:absolute; left:50%; top:100%;
    transform: translateX(-50%);
    border:7px solid transparent; border-top-color:#1f2937;
  }
  .deal-badge:hover .tip,
  .deal-badge:focus-visible .tip{
    opacity:1; transform: translate(-50%, -12px);
  }
  .muted{ opacity:.85; font-weight:600; display:block; margin-top:2px; }

  /* Skeleton */
  .shimmer{ min-width: 190px; min-height: 28px; border-radius:999px;
    background: linear-gradient(90deg,#f6d7df 25%,#ffeaf0 37%,#f6d7df 63%);
    background-size:400% 100%; animation: shimmer 1.2s infinite; }
  @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:0 0} }

  /* Responsivo: quebra se o container for estreito */
  @media (max-width: 480px){
    .deal-badge{ width:100%; justify-content:center; white-space:normal; text-align:center; }
  }
  `]
})
export class DealBadgeComponent implements OnInit {
  @Input({ required: true }) title!: string;

  vm$ = of<{ priceBRL: number; normalBRL: number; storeName: string; url: string; savingsPct: number } | null>(null);
  ready = false;

  constructor(
    private deals: DealsService,
    private fx: FxService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) { this.ready = true; return; }

    const stores$ = this.deals.getStores();
    const best$   = this.deals.bestDeal(this.title);
    const rate$   = this.fx.usdToBrl$();

    this.vm$ = combineLatest([best$, stores$, rate$]).pipe(
      map(([best, stores, rate]) => {
        if (!best) return null;
        const storeName = stores[best.store]?.storeName ?? 'Loja';
        return {
          priceBRL: Math.max(0, best.priceUSD * rate),
          normalBRL: Math.max(0, best.normalUSD * rate),
          storeName,
          url: best.url,
          savingsPct: best.savingsPct
        };
      })
    );
    setTimeout(() => this.ready = true);
  }
}
