import { Component, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';
import { DealsService } from '../../services/deals.service';
import { FxService } from '../../services/fx.service';
import { combineLatest, map, of, shareReplay } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { DealBadgeComponent } from '../../components/deal-badge/deal-badge.component';

type DealRow = {
  store: string;
  priceBRL: number;
  priceUSD: number;
  normalUSD: number;
  savingsPct: number;
  url: string;
};

@Component({
  selector: 'app-jogo-detalhes',
  standalone: true,
  imports: [CommonModule, RouterLink, DealBadgeComponent],
  templateUrl: './jogo-detalhes.html',
  styleUrls: ['./jogo-detalhes.css']
})
export class JogoDetalhesComponent {
  game?: Game;
  deals$ = of<DealRow[]>([]);

  constructor(
    private route: ActivatedRoute,
    private dealsSvc: DealsService,
    private fx: FxService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.game = GAMES.find(g => g.id === id);

    if (!this.game) return;

    if (isPlatformBrowser(this.platformId)) {
      this.deals$ = combineLatest([
        this.dealsSvc.dealsByTitle(this.game.title),
        this.dealsSvc.getStores(),
        this.fx.usdToBrl$()
      ]).pipe(
        map(([deals, stores, rate]) =>
          deals
            .slice()
            .sort((a, b) => Number(a.salePrice) - Number(b.salePrice))
            .slice(0, 6)
            .map(d => ({
              store: stores[d.storeID]?.storeName ?? 'Loja',
              priceUSD: Number(d.salePrice),
              normalUSD: Number(d.normalPrice),
              priceBRL: Number(d.salePrice) * rate,
              savingsPct: Math.max(
                0,
                d.savings
                  ? Number(d.savings)
                  : ((Number(d.normalPrice) - Number(d.salePrice)) / Number(d.normalPrice)) * 100
              ),
              url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`
            }))
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
  }
}
