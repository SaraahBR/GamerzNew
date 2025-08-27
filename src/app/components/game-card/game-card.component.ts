import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../pages/jogos/games.data';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.css']
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;       

  private _favorite = false;
  @Input() set favorite(val: boolean) { this._favorite = !!val; }
  get favorite(): boolean { return this._favorite; }

  @Output() favoriteChange = new EventEmitter<boolean>();

  toggleFavorite() {
    this._favorite = !this._favorite;
    this.favoriteChange.emit(this._favorite);
  }
}
