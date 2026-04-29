import { Injectable, signal } from '@angular/core';

export interface CanvasPageConfig {
  particles: boolean;
  exclusions: string; // seletores CSS separados por vírgula
}

@Injectable({ providedIn: 'root' })
export class CanvasService {
  private _cfg = signal<CanvasPageConfig>({ particles: false, exclusions: '' });
  readonly cfg = this._cfg.asReadonly();

  /** Chamado pelo componente de página ao entrar */
  setPage(particles: boolean, exclusions: string = ''): void {
    this._cfg.set({ particles, exclusions });
  }

  /** Chamado pelo componente de página ao sair */
  clearPage(): void {
    this._cfg.set({ particles: false, exclusions: '' });
  }
}
