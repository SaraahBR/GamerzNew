import { Injectable, computed, effect, signal } from '@angular/core';

export type BacklogStatus = 'pendente' | 'jogando' | 'zerado' | 'dropado';

export interface BacklogItem {
  id: number;
  title: string;
  gameId?: number;     
  platform?: string;
  priority?: 'alta' | 'media' | 'baixa';
  status: BacklogStatus;
  img: string;
  notes?: string;
  createdAt: number;
}

const STORAGE_KEY = 'gn_backlog_v1';

@Injectable({ providedIn: 'root' })
export class BacklogStore {
  /** Só existe window/localStorage no navegador. */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private load(): BacklogItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BacklogItem[]) : [];
    } catch {
      return [];
    }
  }

  private _items = signal<BacklogItem[]>(this.load());

  /** Signals públicas (read-only) */
  readonly items = this._items.asReadonly();

  readonly total = computed(() => this._items().length);
  readonly sorted = computed(() =>
    [...this._items()].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'pt-BR', { sensitivity: 'base' })
    )
  );
  readonly byStatus = computed(() => {
    const map: Record<BacklogStatus, BacklogItem[]> = {
      pendente: [], jogando: [], zerado: [], dropado: []
    };
    for (const it of this._items()) map[it.status].push(it);
    return map;
  });

  /** Persiste toda mudança no storage (apenas no browser) */
  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
      } catch {
      }
    });
  }

  /** CRUD */
  add(data: Omit<BacklogItem, 'id' | 'createdAt'>) {
    const id = Date.now();
    this._items.update(list => [...list, { ...data, id, createdAt: Date.now() }]);
  }

  update(id: number, patch: Partial<BacklogItem>) {
    this._items.update(list => list.map(it => (it.id === id ? { ...it, ...patch } : it)));
  }

  remove(id: number) {
    this._items.update(list => list.filter(it => it.id !== id));
  }

  clear() {
    this._items.set([]);
  }
}
