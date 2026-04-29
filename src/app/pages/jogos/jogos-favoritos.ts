import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GamesService } from '../../services/games.service';
import { Game } from './games.data';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-jogos-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, GameCardComponent],
  templateUrl: './jogos-favoritos.html',
  styleUrls: ['./jogos-favoritos.css'],
})
export class JogosFavoritosComponent implements OnInit, OnDestroy {
  favorites: Game[] = [];
  logged = false;
  loading = true;

  // Loader progressivo
  progress = 0;
  private timer?: any;

  private sub?: Subscription;
  private subAuth?: Subscription;

  constructor(
    private svc: GamesService,
    private auth: AuthService,
    private toasts: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    // mantém a lista de favoritos atualizada
    this.sub = this.svc.games$.subscribe((list) => {
      this.favorites = list.filter((g) => !!g.favorite);
    });

    if (isPlatformBrowser(this.platformId)) {
      // estado otimista: se tem cookie, evita flicker do "faça login"
      this.logged = this.auth.hasSessionCookie() || !!this.auth.snapshot;

      const hasCache =
        this.svc.snapshot.length > 0 ||
        sessionStorage.getItem('gn_catalog_loaded') === '1' ||
        this.svc.loadedOnce;

      if (hasCache) {
        // Agora sempre exibe o carregamento para evitar o "falso 100%"
        this.startLoading();
        await Promise.allSettled([this.svc.refresh(), this.auth.me()]);
        this.logged = !!this.auth.snapshot;
        await this.completeLoading();
        this.loading = false;
      } else {
        // primeira vez: com overlay animado
        this.startLoading();
        await Promise.allSettled([this.svc.refresh(), this.auth.me()]);
        this.logged = !!this.auth.snapshot;
        await this.completeLoading();
        this.loading = false;
      }

      // reagir a login/logout
      let last = this.auth.snapshot?.id ?? null;
      this.subAuth = this.auth.user$.subscribe(u => {
        const cur = u?.id ?? null;
        if (cur !== last) {
          last = cur;
          this.startLoading();
          Promise.allSettled([this.svc.refresh(), this.auth.me()]).finally(async () => {
            await this.completeLoading();
            this.loading = false;
            this.logged = !!this.auth.snapshot;
          });
        }
      });
    } else {
      try { await this.svc.refresh(); } catch {}
      this.logged = !!this.auth.snapshot;
      this.progress = 100;
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.subAuth?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }

  async updateFavorite(g: Game, value: boolean) {
    if (!this.logged) {
      this.toasts.danger('Entre na sua conta para favoritar e gerenciar jogos.', {
        title: 'Login necessário',
        timeout: 4500,
      });
      return;
    }

    try {
      await this.svc.setFavorite(g.id, value);
      this.toasts.success(value ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', {
        timeout: 2200,
      });
    } catch (e: any) {
      const msg =
        e?.code === 'login_required'
          ? 'Você precisa estar logada para alterar favoritos.'
          : 'Não foi possível atualizar o favorito.';
      this.toasts.danger(msg, { title: 'Atenção' });
    }
  }

  // ============== Loader ==============
  private startLoading() {
    this.loading = true;
    this.progress = 0;
    this.timer = setInterval(() => this.tickLoading(), 120);
  }

  private tickLoading() {
    if (this.progress >= 90) return;
    const p = this.progress;
    const delta = p < 15 ? 6 : p < 30 ? 5 : p < 50 ? 4 : p < 70 ? 3 : p < 85 ? 2 : 1;
    this.progress = Math.min(90, p + delta);
  }

  private completeLoading(): Promise<void> {
    return new Promise<void>((resolve) => {
      const fin = setInterval(() => {
        this.progress += 4;
        if (this.progress >= 100) {
          this.progress = 100;
          clearInterval(fin);
          if (this.timer) clearInterval(this.timer);
          setTimeout(() => resolve(), 180);
        }
      }, 40);
    });
  }
}
