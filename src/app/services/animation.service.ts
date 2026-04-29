import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private platformId = inject(PLATFORM_ID);

  private _enabled = signal(true);
  readonly enabled = this._enabled.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('gn-anim');
      const on = stored !== 'false';
      this._enabled.set(on);
      document.body.classList.toggle('no-anim', !on);
    }
  }

  toggle(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const next = !this._enabled();
    this._enabled.set(next);
    localStorage.setItem('gn-anim', String(next));
    document.body.classList.toggle('no-anim', !next);
  }
}
