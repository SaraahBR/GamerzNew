import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Game, GAMES } from '../pages/jogos/games.data';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private _games$ = new BehaviorSubject<Game[]>([...GAMES]);
  public readonly games$ = this._games$.asObservable();

  get snapshot(): Game[] { return this._games$.value; }

  addGame(game: Omit<Game, 'id'>) {
    const list = this._games$.value;
    const nextId = list.length ? Math.max(...list.map(g => g.id)) + 1 : 1;
    const newGame: Game = { id: nextId, favorite: false, ...game };
    this._games$.next([ ...list, newGame ]);
  }

  setFavorite(id: number, value: boolean) {
    const list = this._games$.value.map(g => g.id === id ? { ...g, favorite: value } : g);
    this._games$.next(list);
  }
}
