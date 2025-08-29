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
  styleUrls: ['./jogos.css'],
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

  /** controles de concorrência do loader */
  private cycle = 0; 
  private timer: any | null = null; 
  private capTimeout: any | null = null; 

  constructor(
    private gamesSvc: GamesService,
    private toasts: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // fecha o loader assim que **a primeira lista** chegar
    this.sub = this.gamesSvc.games$.subscribe((list) => {
      this.applyFilter(list);
      if (this.loading) this.completeLoading(this.cycle);
    });

    if (isPlatformBrowser(this.platformId)) {
      const hasCache =
        this.gamesSvc.snapshot.length > 0 ||
        sessionStorage.getItem('gn_catalog_loaded') === '1' ||
        this.gamesSvc.loadedOnce;

      if (hasCache) {
        // já tem algo para mostrar: oculta overlay e faz refresh “silencioso”
        this.loading = false;
        this.progress = 100;
        this.gamesSvc.refresh().catch(() => {});
      } else {
        // primeira visita: exibe loader e espera a **primeira emissão**
        this.startLoading();
        this.gamesSvc
          .refresh()
          .catch(() => {})
          .finally(() => {});
      }

      // login/logout (troca de usuária): um novo ciclo
      this.lastUserId = this.auth.snapshot?.id ?? null;
      this.subAuth = this.auth.user$.subscribe((u) => {
        const cur = u?.id ?? null;
        if (cur !== this.lastUserId) {
          this.lastUserId = cur;
          this.startLoading();
          this.gamesSvc
            .refresh()
            .catch(() => {})
            .finally(() => {
             
            });
        }
      });
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.subAuth?.unsubscribe();
    this.clearTimers();
  }

  onSearchChange() {
    this.applyFilter(this.gamesSvc.snapshot);
  }

  private applyFilter(list: Game[]) {
    const q = this.search.trim().toLowerCase();
    this.games = !q
      ? list
      : list.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.genre.join(' ').toLowerCase().includes(q) ||
            g.dev.toLowerCase().includes(q) ||
            g.pub.toLowerCase().includes(q) ||
            String(g.year).includes(q)
        );
  }

  // ---------------------- Loader ----------------------
  private startLoading() {
    this.cycle++;
    const my = this.cycle;

    this.loading = true;
    this.progress = 0;

    this.clearTimers();

    // barra vai até 90% enquanto espera a primeira lista
    this.timer = setInterval(() => {
      if (this.cycle !== my) return;
      const p = this.progress;
      if (p >= 90) return;
      const delta = p < 15 ? 6 : p < 30 ? 5 : p < 50 ? 4 : p < 70 ? 3 : p < 85 ? 2 : 1;
      this.progress = Math.min(90, p + delta);
    }, 120);

    // hard cap de segurança (8s): se algo der MUITO errado, fecha
    this.capTimeout = setTimeout(() => {
      if (this.cycle === my) this.forceClose();
    }, 8000);
  }

  private async completeLoading(token: number) {
    if (token !== this.cycle) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await new Promise<void>((resolve) => {
      const fin = setInterval(() => {
        this.progress += 6;
        if (this.progress >= 100) {
          clearInterval(fin);
          resolve();
        }
      }, 30);
    });

    if (token !== this.cycle) return;
    this.loading = false;
    if (this.capTimeout) {
      clearTimeout(this.capTimeout);
      this.capTimeout = null;
    }
  }

  private forceClose() {
    this.clearTimers();
    this.progress = 100;
    this.loading = false;
  }

  private clearTimers() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.capTimeout) {
      clearTimeout(this.capTimeout);
      this.capTimeout = null;
    }
  }
  // -----------------------------------------------------------

  async updateFavorite(game: Game, value: boolean) {
    try {
      await this.gamesSvc.setFavorite(game.id, value);
      this.toasts.success(value ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', {
        timeout: 2200,
      });
    } catch (e: any) {
      if (e?.code === 'login_required') {
        this.toasts.danger('Entre na sua conta para favoritar jogos.', {
          title: 'Login necessário',
          timeout: 4500,
        });
      } else {
        this.toasts.danger('Não foi possível atualizar o favorito.', { title: 'Atenção' });
      }
    }
  }
}
