import { Injectable } from '@angular/core';

export type ToastKind = 'danger' | 'warning' | 'success' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  title?: string;
  timeout: number; // ms
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private list: Toast[] = [];
  private listeners = new Set<(l: Toast[]) => void>();
  private seq = 1;

  /** Inscreve para receber a lista de toasts. Retorna uma função para desinscrever. */
  subscribe(fn: (l: Toast[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.list);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.list);
  }

  /** Cria um toast */
  show(kind: ToastKind, text: string, opts?: { title?: string; timeout?: number }): number {
    const t: Toast = {
      id: this.seq++,
      kind,
      text,
      title: opts?.title,
      timeout: Math.max(1000, opts?.timeout ?? 4000),
    };

    // adiciona no topo
    this.list = [t, ...this.list];
    this.emit();

    if (t.timeout > 0) {
      setTimeout(() => this.dismiss(t.id), t.timeout);
    }
    return t.id;
  }

  /** Apaga um toast */
  dismiss(id: number) {
    const before = this.list.length;
    this.list = this.list.filter(x => x.id !== id);
    if (this.list.length !== before) this.emit();
  }

  // atalhos
  danger(text: string, opts?: { title?: string; timeout?: number })   { return this.show('danger',  text, opts); }
  warning(text: string, opts?: { title?: string; timeout?: number })  { return this.show('warning', text, opts); }
  success(text: string, opts?: { title?: string; timeout?: number })  { return this.show('success', text, opts); }
  info(text: string, opts?: { title?: string; timeout?: number })     { return this.show('info',    text, opts); }
}
