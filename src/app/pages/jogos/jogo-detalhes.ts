import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';
import { ItadService, ItadOffer } from '../../services/itad.service';
import { map, of, shareReplay } from 'rxjs';
import { DealBadgeComponent } from '../../components/deal-badge/deal-badge.component';
import { GamesService } from '../../services/games.service';
import { CanvasService } from '../../services/canvas.service';

type DealRow = {
  store: string;
  price: number;
  currency: string;
  cut: number;
  regular: number | null;
  url: string;
};

// Seletores onde as partículas NÃO devem aparecer para não atrapalhar a leitura/clique
const DETALHES_EXCLUSIONS = 'h1, .desc, .meta, .deals-acc, .btn-gradiente, .btn-sec, .banner, th, td, summary';

@Component({
  selector: 'app-jogo-detalhes',
  standalone: true,
  imports: [CommonModule, RouterLink, DealBadgeComponent],
  templateUrl: './jogo-detalhes.html',
  styleUrls: ['./jogo-detalhes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JogoDetalhesComponent implements OnInit, OnDestroy {
  game?: Game;
  deals$ = of<DealRow[]>([]); 

  constructor(
    private route: ActivatedRoute,
    private itad: ItadService,
    private gamesSvc: GamesService,
    private canvasSvc: CanvasService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.canvasSvc.setPage(true, DETALHES_EXCLUSIONS);
    }

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
    this.cdr.markForCheck(); // Notifica Angular para renderizar (necessário com OnPush)
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
      this.cdr.markForCheck(); // Atualiza a view quando o Observable é configurado
    } else {
      this.deals$ = of([]);
    }
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
  }
}
