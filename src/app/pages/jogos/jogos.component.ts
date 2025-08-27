import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Game } from './games.data';
import { GamesService } from '../../services/games.service';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jogos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GameCardComponent],
  templateUrl: './jogos.component.html',
  styleUrls: ['./jogos.component.css']
})
export class JogosComponent implements OnInit, OnDestroy {
  search = '';                 
  games: Game[] = [];          
  private sub?: Subscription;  

  constructor(private gamesSvc: GamesService) {}

  ngOnInit() {
    this.sub = this.gamesSvc.games$.subscribe(list => {
      this.applyFilter(list);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  onSearchChange() { this.applyFilter(this.gamesSvc.snapshot); }

  private applyFilter(list: Game[]) {
    const q = this.search.trim().toLowerCase();
    this.games = !q ? list : list.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.genre.join(' ').toLowerCase().includes(q) ||
      g.dev.toLowerCase().includes(q) ||
      g.pub.toLowerCase().includes(q) ||
      String(g.year).includes(q)
    );
  }

  updateFavorite(game: Game, value: boolean) {
    this.gamesSvc.setFavorite(game.id, value);
  }
}
