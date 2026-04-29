import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Game, GAMES } from '../pages/jogos/games.data';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly auth = inject(AuthService);

  // Inicializa com os jogos estáticos para renderização imediata.
  // O refresh() irá sobrescrever com favoritos e jogos customizados.
  private _games$ = new BehaviorSubject<Game[]>(
    GAMES.map(g => ({ ...g, favorite: false }))
  );
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

      try {
        for (const x of items) {
          const t = typeof x?.title === 'string' ? x.title : null;
          const id = typeof x?.itadId === 'string' ? x.itadId : null;
          if (t && id) this.rememberItadId(t, id);
        }
      } catch {}

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

      // Se backend devolver itadId, guarda localmente (cache leve)
      try {
        if (typeof it?.title === 'string' && typeof it?.itadId === 'string') {
          this.rememberItadId(it.title, it.itadId);
        }
      } catch {}

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

    // quando logada: apenas os jogos que a usuária adicionou
    // (jogos estáticos ficam visíveis apenas para visitantes não logados)
    const list = this._custom.slice();

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

  /** Países preferidos p/ preços do ITAD: tenta BR, cai para US */
  readonly preferredItadCountries: ReadonlyArray<string> = ['BR', 'US'];

  /** Normaliza título para usar como chave de cache */
  private normTitle(t: string): string {
    return (t || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  /** Lê o mapa (título -> itadId) do sessionStorage (rápido) e do localStorage (persistente) */
  private readItadMap(): Record<string, string> {
    if (!this.isBrowser) return {};
    let acc: Record<string, string> = {};
    try {
      const s = window.sessionStorage.getItem('gn_itad_map_v1');
      if (s) acc = { ...acc, ...(JSON.parse(s) || {}) };
    } catch {}
    try {
      const l = window.localStorage.getItem('gn_itad_map_v1');
      if (l) acc = { ...acc, ...(JSON.parse(l) || {}) };
    } catch {}
    return acc;
    }

  /** Persiste o mapa leve (merge) */
  private writeItadMap(partial: Record<string, string>, persist = true): void {
    if (!this.isBrowser) return;
    try {
      const current = this.readItadMap();
      const next = { ...current, ...partial };
      window.sessionStorage.setItem('gn_itad_map_v1', JSON.stringify(next));
      if (persist) {
        window.localStorage.setItem('gn_itad_map_v1', JSON.stringify(next));
      }
    } catch {}
  }

  /** Retorna itadId do cache local */
  getItadIdFromCache(title: string): string | null {
    const m = this.readItadMap();
    const k = this.normTitle(title);
    return m[k] || null;
  }

  /** Guarda itadId no cache local */
  rememberItadId(title: string, itadId: string, persist = true): void {
    const k = this.normTitle(title);
    if (!k || !itadId) return;
    this.writeItadMap({ [k]: itadId }, persist);
  }

  async lookupAndCacheItadId(title: string): Promise<string | null> {
    if (!this.isBrowser) return null;

    const fromCache = this.getItadIdFromCache(title);
    if (fromCache) return fromCache;

    try {
      const q = encodeURIComponent(title || '');
      const r = await fetch(`/api/itad/lookup?title=${q}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      if (!r.ok) return null;
      const j = await r.json();
      const itadId = typeof j?.id === 'string' ? j.id : null;
      if (itadId) this.rememberItadId(title, itadId);
      return itadId;
    } catch {
      return null;
    }
  }

  async setItadIdForCustomGame(gameId: number, itadId: string): Promise<boolean> {
    if (!this.isBrowser) return false;
    try {
      const r = await fetch('/api/games/custom/set-itad-id', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId, itadId }),
      });
      if (r.ok) {
        const g = this.snapshot.find(x => x.id === gameId);
        if (g?.title) this.rememberItadId(g.title, itadId); 
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  clearClientCaches(): void {
    if (!this.isBrowser) return;
    try { window.sessionStorage.removeItem('gn_catalog_loaded'); } catch {}
    try { window.sessionStorage.removeItem('gn_itad_map_v1'); } catch {}
  }
}
