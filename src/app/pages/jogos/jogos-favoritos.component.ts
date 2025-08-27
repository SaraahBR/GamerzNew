import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GamesService } from '../../services/games.service';
import { Game } from './games.data';
import { GameCardComponent } from '../../components/game-card/game-card.component';

@Component({
  selector: 'app-jogos-favoritos',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './jogos-favoritos.component.html',
  styleUrls: ['./jogos-favoritos.component.css']
})
export class JogosFavoritosComponent implements OnInit, OnDestroy {
  favorites: Game[] = [];
  private sub?: Subscription;

  constructor(private svc: GamesService) {}

  ngOnInit() {
    this.sub = this.svc.games$.subscribe(list => {
      this.favorites = list.filter(g => !!g.favorite);
    });
  }
  ngOnDestroy() { this.sub?.unsubscribe(); }

  updateFavorite(g: Game, value: boolean) {
    this.svc.setFavorite(g.id, value);
  }
}
