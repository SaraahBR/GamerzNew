import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="toasts" aria-live="polite" aria-atomic="true">
      <article
        *ngFor="let t of list"
        class="toast"
        [class.danger]="t.kind === 'danger'"
        [class.info]="t.kind === 'info'"
        [class.success]="t.kind === 'success'"
        [class.warning]="t.kind === 'warning'"
        [attr.role]="t.kind === 'danger' ? 'alert' : 'status'"
      >
        <div class="glow"></div>

        <div class="icon" aria-hidden="true">
          <span *ngIf="t.kind === 'danger'">⚠️</span>
          <span *ngIf="t.kind === 'warning'">⚡</span>
          <span *ngIf="t.kind === 'success'">✔</span>
          <span *ngIf="t.kind === 'info'">🎮</span>
        </div>

        <div class="content">
          <h4>{{ t.title || (t.kind === 'danger' ? 'Atenção' : 'Aviso') }}</h4>
          <p>{{ t.text }}</p>
        </div>

        <button class="close" (click)="dismiss(t.id)" aria-label="Fechar">×</button>

        <!-- A duração vai em uma CSS variable -->
        <span class="timer" [style.--dur.ms]="t.timeout"></span>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483647;
      }

      .toasts {
        --toast-offset-top: 88px;
        position: fixed;
        top: var(--toast-offset-top);
        right: 16px;
        display: grid;
        gap: 10px;
        z-index: inherit;
        pointer-events: none;
      }

      /* ── BASE ── */
      .toast {
        color: #f0e8ff;
        background: rgba(16,4,32,.88);
        border: 1px solid rgba(233,30,99,.35);
        border-radius: 14px;
        min-width: 290px;
        max-width: 400px;
        box-shadow:
          0 0 24px rgba(233,30,99,.12),
          0 12px 32px rgba(0,0,0,.55);
        overflow: hidden;
        position: relative;
        display: grid;
        grid-template-columns: 44px 1fr auto;
        gap: 10px;
        padding: 12px 12px 16px 10px;
        pointer-events: auto;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        animation: toast-in .2s cubic-bezier(.22,.68,0,1.2) both;
      }

      /* ── VARIANTES ── */
      .toast.success {
        border-color: rgba(233,30,99,.40);
        box-shadow: 0 0 28px rgba(233,30,99,.16), 0 12px 32px rgba(0,0,0,.55);
      }
      .toast.danger {
        border-color: rgba(255,50,80,.50);
        box-shadow: 0 0 28px rgba(255,50,80,.20), 0 12px 32px rgba(0,0,0,.55);
      }
      .toast.warning {
        border-color: rgba(217,70,239,.40);
        box-shadow: 0 0 28px rgba(217,70,239,.16), 0 12px 32px rgba(0,0,0,.55);
      }
      .toast.info {
        border-color: rgba(139,92,246,.40);
        box-shadow: 0 0 28px rgba(139,92,246,.16), 0 12px 32px rgba(0,0,0,.55);
      }

      /* ── GLOW (linha de brilho no topo) ── */
      .glow {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,119,200,.6), transparent);
        pointer-events: none;
      }
      .toast.danger  .glow { background: linear-gradient(90deg, transparent, rgba(255,80,100,.7), transparent); }
      .toast.warning .glow { background: linear-gradient(90deg, transparent, rgba(217,70,239,.7), transparent); }
      .toast.info    .glow { background: linear-gradient(90deg, transparent, rgba(139,92,246,.7), transparent); }

      /* ── ÍCONE ── */
      .icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        font-size: 18px;
        background: rgba(255,119,200,.10);
        border: 1px solid rgba(255,119,200,.20);
        margin-left: 2px;
      }
      .toast.danger  .icon { background: rgba(255,80,100,.12); border-color: rgba(255,80,100,.25); }
      .toast.warning .icon { background: rgba(217,70,239,.12); border-color: rgba(217,70,239,.25); }
      .toast.info    .icon { background: rgba(139,92,246,.12); border-color: rgba(139,92,246,.25); }

      /* ── TEXTO ── */
      .content { padding-top: 2px; }
      h4 {
        margin: 0 0 3px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: .3px;
        background: linear-gradient(90deg, #ff77c8, #d946ef);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .toast.danger  h4 { background: linear-gradient(90deg, #ff5068, #ff8090); -webkit-background-clip: text; background-clip: text; }
      .toast.warning h4 { background: linear-gradient(90deg, #d946ef, #a855f7); -webkit-background-clip: text; background-clip: text; }
      .toast.info    h4 { background: linear-gradient(90deg, #818cf8, #a78bfa); -webkit-background-clip: text; background-clip: text; }
      p {
        margin: 0;
        font-size: 12.5px;
        line-height: 1.4;
        color: rgba(240,232,255,.75);
      }

      /* ── FECHAR ── */
      .close {
        align-self: start;
        font: inherit;
        color: rgba(255,255,255,.5);
        background: transparent;
        border: 0;
        cursor: pointer;
        width: 26px;
        height: 26px;
        border-radius: 6px;
        font-size: 18px;
        line-height: 1;
        transition: color .15s, background .15s;
      }
      .close:hover { color: #fff; background: rgba(255,255,255,.08); }

      /* ── TIMER (barra inferior) ── */
      .timer {
        position: absolute;
        left: 0; bottom: 0;
        height: 2px;
        width: 100%;
        background: rgba(255,255,255,.06);
        overflow: hidden;
      }
      .timer::after {
        content: '';
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #e91e63, #d946ef);
        animation: shrink linear forwards;
        transform-origin: left center;
      }
      .toast.danger  .timer::after { background: linear-gradient(90deg, #ff3350, #ff6080); }
      .toast.warning .timer::after { background: linear-gradient(90deg, #d946ef, #a855f7); }
      .toast.info    .timer::after { background: linear-gradient(90deg, #818cf8, #a78bfa); }

      @keyframes shrink {
        from { transform: scaleX(1); }
        to   { transform: scaleX(0); }
      }
      @keyframes toast-in {
        from { transform: translateX(18px) scale(.97); opacity: 0; }
        to   { transform: translateX(0)     scale(1);   opacity: 1; }
      }

      @media (max-width: 420px) {
        .toasts { left: 12px; right: 12px; }
        .toast  { max-width: 100%; min-width: 0; }
      }
    `,
  ],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  list: Toast[] = [];
  private _unsub?: () => void;

  constructor(private toasts: ToastService) {}

  ngOnInit() {
    this._unsub = this.toasts.subscribe((l) => (this.list = l));
  }

  ngOnDestroy() {
    this._unsub?.();
  }

  dismiss(id: number) {
    this.toasts.dismiss(id);
  }
}
