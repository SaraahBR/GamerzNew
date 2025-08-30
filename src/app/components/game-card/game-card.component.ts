import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Game } from '../../pages/jogos/games.data';
import { BacklogStore } from '../../features/backlog/backlog.store';
import { DealBadgeComponent } from '../../components/deal-badge/deal-badge.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/ui/toast.service';
import { WordClampDirective } from '../../shared/directives/word-clamp.directive'; 

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DealBadgeComponent, WordClampDirective], 
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

  constructor(
    private backlog: BacklogStore,
    private auth: AuthService,
    private toasts: ToastService
  ) {}

  /** Conveniência */
  private get isLogged(): boolean {
    return !!this.auth.snapshot;
  }

  /** Reativo: ler `items()` dispara atualização do sinal */
  get isInBacklog(): boolean {
    const items = this.backlog.items();
    const id = this.game?.id;
    return !!id && !!items.find(it => it.gameId === id);
  }

  toggleFavorite(): void {
    // bloqueia para não-logada: NÃO altera o coração e avisa
    if (!this.isLogged) {
      this.toasts.danger('Entre na sua conta para favoritar jogos.', {
        title: 'Login necessário',
        timeout: 4500,
      });
      return;
    }
    this._favorite = !this._favorite;
    this.favoriteChange.emit(this._favorite);
  }

  toggleBacklog(): void {
    if (!this.game) return;

    // bloqueia para não-logada: NÃO altera nada e avisa
    if (!this.isLogged) {
      this.toasts.warning('Faça login para usar o Backlog.', {
        title: 'Login necessário',
        timeout: 4500,
      });
      return;
    }

    const items = this.backlog.items();
    const exists = items.find(it => it.gameId === this.game.id);

    if (exists) {
      this.backlog.remove(exists.id);
      return;
    }

    this.backlog.add({
      title: this.game.title,
      gameId: this.game.id,
      img: this.game.img,
      status: 'pendente',
    });
  }
}
