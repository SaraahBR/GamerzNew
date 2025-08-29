import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../pages/jogos/games.data';
import { BacklogStore } from '../../features/backlog/backlog.store';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;

  private _favorite = false;
  @Input() set favorite(val: boolean) { this._favorite = !!val; }
  get favorite(): boolean { return this._favorite; }

  @Output() favoriteChange = new EventEmitter<boolean>();

  constructor(private backlog: BacklogStore) {}

  /** Reativo: como é uma Signal, ler `items()` em render dispara atualização automática */
  get isInBacklog(): boolean {
    const items = this.backlog.items(); 
    return !!items.find(it => it.gameId === this.game?.id);
  }

  toggleFavorite(): void {
    this._favorite = !this._favorite;
    this.favoriteChange.emit(this._favorite);
  }

  toggleBacklog(): void {
    if (!this.game) return;
    const items = this.backlog.items();
    const exists = items.find(it => it.gameId === this.game.id);
    if (exists) {
      this.backlog.remove(exists.id);
      return;
    }
    // adiciona com status padrão e dados básicos
    this.backlog.add({
      title: this.game.title,
      gameId: this.game.id,
      img: this.game.img,
      status: 'pendente',
    });
  }
}
