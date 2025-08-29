import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Game, GAMES } from '../pages/jogos/games.data';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly auth = inject(AuthService);

  private _games$ = new BehaviorSubject<Game[]>([]);
  readonly games$ = this._games$.asObservable();

  /** Jogos criados localmente (persistidos por userId em localStorage) – usado como fallback */
  private _custom: Game[] = [];

  /** Indica se o catálogo já foi carregado ao menos uma vez nesta aba. */
  private _loadedOnce = false;
  get loadedOnce() { return this._loadedOnce; }

  /** Snapshot atual dos jogos */
  get snapshot(): Game[] {
    return this._games$.getValue();
  }

  /** ======================== Helpers ======================== */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private get userId(): string | null {
    return this.auth.snapshot?.id ?? null;
  }

  private storageKey(userId: string) {
    return `gn_custom_games_${userId}`;
  }

  private get ss(): Storage | null {
    try { return this.isBrowser ? window.sessionStorage : null; } catch { return null; }
  }

  private loadCustom(): void {
    if (!this.isBrowser) { this._custom = []; return; }
    const uid = this.userId;
    if (!uid) { this._custom = []; return; }
    try {
      const raw = window.localStorage.getItem(this.storageKey(uid));
      this._custom = raw ? (JSON.parse(raw) as Game[]) : [];
    } catch {
      this._custom = [];
    }
  }

  private saveCustom(): void {
    if (!this.isBrowser) return;
    const uid = this.userId;
    if (!uid) return;
    try {
      window.localStorage.setItem(this.storageKey(uid), JSON.stringify(this._custom));
    } catch {}
  }

  private isServerGame(id: number): boolean {
    return GAMES.some(g => g.id === id);
  }

  private sortByTitle(list: Game[]): Game[] {
    return list.slice().sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'pt-BR', { sensitivity: 'base' })
    );
  }

  /** ======================== API (Neon) ======================== */

  /** GET /api/games/favorites (com cookies) */
  private async fetchFavoriteIds(): Promise<number[]> {
    try {
      const r = await fetch('/api/games/favorites', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j?.ids)
        ? j.ids.map((n: any) => Number(n)).filter((n: any) => Number.isInteger(n))
        : [];
    } catch {
      return [];
    }
  }

  /** GET custom games do usuário logado (Neon) */
  private async fetchCustomGames(): Promise<Game[]> {
    if (!this.isBrowser) return [];
    try {
      const r = await fetch('/api/games/custom/list', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) throw new Error('list_failed');

      const j = await r.json();
      const items = Array.isArray(j?.items) ? j.items : [];

      // Mapeia para o tipo Game que o app usa
      const mapped: Game[] = items.map((x: any) => ({
        id: Number(x.id),
        title: String(x.title),
        img: String(x.img),
        genre: Array.isArray(x.genre) ? x.genre.slice() : [],
        year: Number(x.year),
        dev: String(x.dev),
        pub: String(x.pub),
        description: String(x.description),
        steam: String(x.steam),
        favorite: !!x.favorite,
      }));

      return mapped;
    } catch {
      // fallback: usa o localStorage se a API falhar
      this.loadCustom();
      return this._custom.slice();
    }
  }

  /** POST cria custom game (Neon) */
  private async createCustomGame(payload: Omit<Game, 'id'>): Promise<Game | null> {
    if (!this.isBrowser) return null;
    try {
      const r = await fetch('/api/games/custom/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('create_failed');

      const j = await r.json();
      const it = j?.item;
      if (!it) return null;

      const created: Game = {
        id: Number(it.id),
        title: String(it.title),
        img: String(it.img),
        genre: Array.isArray(it.genre) ? it.genre.slice() : [],
        year: Number(it.year),
        dev: String(it.dev),
        pub: String(it.pub),
        description: String(it.description),
        steam: String(it.steam),
        favorite: !!it.favorite
      };
      return created;
    } catch {
      return null;
    }
  }

  /** POST /api/games/custom/favorite (Neon) */
  private async setCustomFavorite(id: number, value: boolean): Promise<boolean> {
    if (!this.isBrowser) return false;
    try {
      const r = await fetch('/api/games/custom/favorite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value })
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  /** ======================== Público ======================== */

  /** Recarrega a lista, aplica favoritos e **ordena** por título. */
  async refresh(): Promise<void> {
    // SSR: não faça chamadas de rede; entregue catálogo público e finalize
    if (!this.isBrowser) {
      const list = GAMES.map(g => ({ ...g, favorite: false }));
      this._games$.next(this.sortByTitle(list));
      this._loadedOnce = true;
      return;
    }

    try { await this.auth.me(); } catch {}
    const logged = !!this.auth.snapshot;

    if (!logged) {
      this._custom = [];
      const list = GAMES.map(g => ({ ...g, favorite: false }));
      this._games$.next(this.sortByTitle(list));
      this._loadedOnce = true;
      this.ss?.setItem('gn_catalog_loaded', '1');
      return;
    }

    // carregar custom games do servidor (com fallback local)
    const custom = await this.fetchCustomGames();
    this._custom = custom.slice();

    // base: custom da usuária + catálogo fixo
    const base = [...this._custom, ...GAMES];

    // favoritos vindos do backend
    const favIds = new Set<number>(await this.fetchFavoriteIds());

    const list = base.map(g => {
      if (this.isServerGame(g.id)) {
        return { ...g, favorite: favIds.has(g.id) };
      }
      // jogo custom já vem com favorite (Neon) – preserva
      return { ...g };
    });

    this._games$.next(this.sortByTitle(list));

    // marca como carregado
    this._loadedOnce = true;
    this.ss?.setItem('gn_catalog_loaded', '1');
  }

  async setFavorite(id: number, value: boolean): Promise<void> {
    if (!this.auth.snapshot) {
      const err: any = new Error('Login requerido');
      err.code = 'login_required';
      throw err;
    }

    const prev = this.snapshot;
    const optimistic = prev.map(g => g.id === id ? { ...g, favorite: value } : g);
    this._games$.next(optimistic);

    if (this.isServerGame(id)) {
      try {
        const r = await fetch('/api/games/favorite', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, value })
        });
        if (!r.ok) throw new Error('persist_failed');
      } catch (e) {
        this._games$.next(prev);
        throw e;
      }
      return;
    }

    // favorito de jogo custom (Neon, com fallback local)
    try {
      const ok = await this.setCustomFavorite(id, value);
      if (ok) {
        // reflete também no array _custom para manter coerência
        const idx = this._custom.findIndex(c => c.id === id);
        if (idx >= 0) this._custom[idx] = { ...this._custom[idx], favorite: value };
      } else {
        // fallback: localStorage
        const idx = this._custom.findIndex(c => c.id === id);
        if (idx >= 0) {
          this._custom[idx] = { ...this._custom[idx], favorite: value };
          this.saveCustom();
        } else {
          throw new Error('custom_not_found');
        }
      }
    } catch (e) {
      this._games$.next(prev);
      throw e;
    }
  }

  /** Adiciona um novo jogo (prioriza Neon; cai para localStorage se API indisponível) e reordena a lista. */
  async addGame(payload: Omit<Game, 'id'> & Partial<Pick<Game, 'id'>>): Promise<Game> {
    if (!this.auth.snapshot) {
      const err: any = new Error('Login requerido');
      err.code = 'login_required';
      throw err;
    }

    // Normaliza o payload para o POST (sem id)
    const toCreate: Omit<Game, 'id'> = {
      title: payload.title,
      img: payload.img,
      genre: payload.genre,
      year: payload.year,
      dev: payload.dev,
      pub: payload.pub,
      description: payload.description,
      steam: payload.steam,
      favorite: !!payload.favorite,
    } as Omit<Game, 'id'>;

    // 1) Tenta criar no Neon
    const created = await this.createCustomGame(toCreate);
    if (created) {
      // atualiza coleção custom em memória
      this._custom = [created, ...this._custom];

      // publica e ordena
      const next = this.sortByTitle([created, ...this.snapshot]);
      this._games$.next(next);
      return created;
    }

    // 2) Fallback local: manter comportamento anterior
    this.loadCustom();

    const current = this.snapshot;
    const nextId = payload.id ?? (current.length ? Math.max(...current.map(g => g.id)) + 1 : 1);

    const game: Game = {
      id: nextId,
      title: payload.title!,
      img: payload.img!,
      genre: payload.genre!,
      year: payload.year!,
      dev: payload.dev!,
      pub: payload.pub!,
      description: payload.description!,
      steam: payload.steam!,
      favorite: !!payload.favorite,
    } as Game;

    // salva na coleção custom e persiste no storage
    this._custom = [game, ...this._custom];
    this.saveCustom();

    // publica imediatamente e ordena
    const next = this.sortByTitle([game, ...current]);
    this._games$.next(next);

    return game;
  }
}
