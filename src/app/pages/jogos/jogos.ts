import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { Game } from './games.data';
import { GamesService } from '../../services/games.service';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { Subscription } from 'rxjs';
import { ToastService } from '../../shared/ui/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-jogos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GameCardComponent],
  templateUrl: './jogos.html',
  styleUrls: ['./jogos.css']
})
export class JogosComponent implements OnInit, OnDestroy {
  search = '';
  games: Game[] = [];
  private sub?: Subscription;
  private subAuth?: Subscription;
  private lastUserId?: string | null = null;

  // LOADER
  loading = true;
  progress = 0;
  private timer?: any;
  private loadToken = 0;

  constructor(
    private gamesSvc: GamesService,
    private toasts: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.sub = this.gamesSvc.games$.subscribe(list => this.applyFilter(list));

    if (isPlatformBrowser(this.platformId)) {
      const hasCache =
        this.gamesSvc.snapshot.length > 0 ||
        sessionStorage.getItem('gn_catalog_loaded') === '1' ||
        this.gamesSvc.loadedOnce;

      if (hasCache) {
        this.loading = false;
        this.progress = 100;
        // atualiza em background, sem travar a UI
        this.gamesSvc.refresh().catch(() => {});
      } else {
        // primeira visita: mostra loader e amarra no token
        const t = this.startLoading();
        this.gamesSvc.refresh()
          .catch(() => {})
          .finally(() => this.completeLoading(t));
      }

      // ao trocar usuário (login/logout), força novo ciclo de loading
      this.lastUserId = this.auth.snapshot?.id ?? null;
      this.subAuth = this.auth.user$.subscribe(u => {
        const cur = u?.id ?? null;
        if (cur !== this.lastUserId) {
          this.lastUserId = cur;
          const t = this.startLoading();
          this.gamesSvc.refresh()
            .catch(() => {})
            .finally(() => this.completeLoading(t));
        }
      });
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.subAuth?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }

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

  // ---------- Loader ----------
  private startLoading(): number {
    if (this.timer) clearInterval(this.timer);
    const token = ++this.loadToken;

    this.loading = true;
    this.progress = 0;

    this.timer = setInterval(() => {
      if (token !== this.loadToken) return;
      if (this.progress >= 90) return;
      const p = this.progress;
      const delta = p < 15 ? 6 : p < 30 ? 5 : p < 50 ? 4 : p < 70 ? 3 : p < 85 ? 2 : 1;
      this.progress = Math.min(90, p + delta);
    }, 120);

    return token;
  }

  private async completeLoading(token: number) {
    if (token !== this.loadToken) return;

    const run = () => new Promise<void>(resolve => {
      const fin = setInterval(() => {
        if (token !== this.loadToken) { clearInterval(fin); resolve(); return; }
        this.progress += 4;
        if (this.progress >= 100) {
          this.progress = 100;
          clearInterval(fin);
          resolve();
        }
      }, 40);
    });

    await run();

    if (token === this.loadToken) {
      if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
      setTimeout(() => { if (token === this.loadToken) this.loading = false; }, 180);
    }
  }

  async updateFavorite(game: Game, value: boolean) {
    try {
      await this.gamesSvc.setFavorite(game.id, value);
      this.toasts.success(value ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', { timeout: 2200 });
    } catch (e: any) {
      if (e?.code === 'login_required') {
        this.toasts.danger('Entre na sua conta para favoritar jogos.', { title: 'Login necessário', timeout: 4500 });
      } else {
        this.toasts.danger('Não foi possível atualizar o favorito.', { title: 'Atenção' });
      }
    }
  }
}
