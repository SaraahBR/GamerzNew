import { Component, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';
import { ItadService, ItadOffer } from '../../services/itad.service';
import { map, of, shareReplay } from 'rxjs';
import { DealBadgeComponent } from '../../components/deal-badge/deal-badge.component';
import { GamesService } from '../../services/games.service';

type DealRow = {
  store: string;
  price: number;
  currency: string;
  cut: number;
  regular: number | null;
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
    private itad: ItadService,
    private gamesSvc: GamesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // 1) tenta catálogo estático (prerender)
    let found = GAMES.find(g => g.id === id);

    // 2) se não achou, tenta o catálogo dinâmico (jogos criados em "Novo")
    if (!found && isPlatformBrowser(this.platformId)) {
      if (!this.gamesSvc.snapshot.length) {
        try { await this.gamesSvc.refresh(); } catch { /* ignora */ }
      }
      found = this.gamesSvc.snapshot.find(g => g.id === id);
    }

    this.game = found;
    if (!this.game) return;

    // 3) carrega ofertas (preferência BR; fallback para US ocorre no /api/itad)
    if (isPlatformBrowser(this.platformId)) {
      this.deals$ = this.itad.offersForGame(this.game, { country: 'BR' }).pipe(
        map((list: ItadOffer[]) =>
          list.slice(0, 6).map(o => ({
            store: o.store,
            price: o.price,
            currency: o.currency,
            cut: o.cut,
            regular: o.regular,
            url: o.url || ''
          }))
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    } else {
      this.deals$ = of([]);
    }
  }
}
