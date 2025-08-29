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
        z-index: 2147483647; /* acima de qualquer header */
      }

      /* permite ajustar a distância do topo sem mexer no TS */
      .toasts {
        --toast-offset-top: 88px; /* ajuste fino: altura aproximada do header */
        position: fixed;
        top: var(--toast-offset-top);
        right: 16px;
        display: grid;
        gap: 12px;
        z-index: inherit;
        pointer-events: none;
      }

      .toast {
        --pink-1: #ff68a7;
        --pink-2: #ff8fc2;
        --danger: #ff3366;

        color: #fff;
        background: linear-gradient(135deg, var(--pink-1), var(--pink-2));
        border-radius: 14px;
        min-width: 290px;
        max-width: 420px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        overflow: hidden;
        position: relative;
        display: grid;
        grid-template-columns: 46px 1fr auto;
        gap: 10px;
        padding: 12px 12px 14px 10px;
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(4px);
        animation: pop 0.18s ease-out both;
      }

      .toast.danger {
        border-color: rgba(255, 51, 102, 0.55);
      }
      .toast.danger .glow {
        box-shadow: 0 0 24px rgba(255, 51, 102, 0.45);
      }

      .glow {
        position: absolute;
        inset: -2px;
        border-radius: 16px;
        pointer-events: none;
      }

      .icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        font-size: 20px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        margin-left: 2px;
      }

      .content {
        padding-top: 2px;
      }
      h4 {
        margin: 0 0 2px;
        font-size: 14px;
        letter-spacing: 0.3px;
      }
      p {
        margin: 0;
        font-size: 13px;
        line-height: 1.35;
        opacity: 0.95;
      }

      .close {
        align-self: start;
        font: inherit;
        color: #fff;
        opacity: 0.9;
        background: transparent;
        border: 0;
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        transition: background 0.15s ease;
      }
      .close:hover {
        background: rgba(0, 0, 0, 0.18);
      }

      .timer {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 100%;
        background: rgba(0, 0, 0, 0.18);
        overflow: hidden;
      }
      .timer::after {
        content: '';
        display: block;
        height: 100%;
        background: #fff;
        opacity: 0.95;
        animation: shrink linear forwards;
        transform-origin: left center;
      }

      @keyframes shrink {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
      @keyframes pop {
        from {
          transform: translateY(-6px) scale(0.98);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      /* variantes */
      .toast.success {
        background: linear-gradient(135deg, #ff78b2, #ff9dd0);
      }
      .toast.warning {
        background: linear-gradient(135deg, #ff6aa0, #ff8bb6);
      }
      .toast.info {
        background: linear-gradient(135deg, #ff6fb0, #ff92c7);
      }

      @media (prefers-color-scheme: dark) {
        .toast {
          color: #fff;
        }
      }

      /* responsivo em telas bem estreitas */
      @media (max-width: 420px) {
        .toasts {
          left: 12px;
          right: 12px;
        }
        .toast {
          max-width: 100%;
        }
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
