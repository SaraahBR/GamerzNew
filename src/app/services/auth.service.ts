import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type User = { id: string; email: string; name?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {
  }

  /** Heurística instantânea (sem rede) para saber se provavelmente há sessão */
  hasSessionCookie(): boolean {
    if (typeof document === 'undefined') return false;
    return /(?:^|;\s*)gn_session=/.test(document.cookie);
  }

  async me(): Promise<void> {
    if (typeof window === 'undefined') return;

    const res = await firstValueFrom(
      this.http.get<{ user: User | null }>('/api/auth/me', { withCredentials: true })
    );
    this._user$.next(res.user);
  }

  async login(email: string, name?: string): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<{ user: User }>('/api/auth/login', { email, name }, { withCredentials: true })
    );
    this._user$.next(res.user);
    return res.user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}, { withCredentials: true }));
    this._user$.next(null);
  }

  get snapshot(): User | null { return this._user$.value; }
}
