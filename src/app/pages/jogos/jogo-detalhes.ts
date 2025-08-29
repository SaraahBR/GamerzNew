import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';
import { ItadService, ItadOffer } from '../../services/itad.service';
import { map, of, shareReplay } from 'rxjs';
import { DealBadgeComponent } from '../../components/deal-badge/deal-badge.component';

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
    private itad: ItadService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.game = GAMES.find(g => g.id === id);
    if (!this.game) return;

    this.deals$ = this.itad.offersByTitle(this.game.title).pipe(
      map((list: ItadOffer[]) => list.slice(0, 6).map(o => ({
        store: o.store,
        price: o.price,
        currency: o.currency,
        cut: o.cut,
        regular: o.regular,
        url: o.url
      }))),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
