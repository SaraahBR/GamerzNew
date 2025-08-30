import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appWordClamp]',
  standalone: true,
})
export class WordClampDirective implements AfterViewInit, OnDestroy {
  private _lines = 2;
  @Input('appWordClamp')
  set lines(v: number | string) {
    const n = Number(v);
    this._lines = Number.isFinite(n) && n > 0 ? Math.max(1, Math.floor(n)) : 2;
    this.schedule();
  }

  private original = '';
  private ro?: ResizeObserver;
  private scheduled = false;
  private alive = true;

  private get isBrowser() {
    return typeof window !== 'undefined' && !!window.document;
  }

  constructor(private elRef: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const el = this.elRef.nativeElement;
    // guarda o texto original apenas uma vez
    this.original = (el.textContent ?? '').trim();

    // Observa mudanças de tamanho para recalcular
    this.zone.runOutsideAngular(() => {
      this.ro = new ResizeObserver(() => this.schedule());
      this.ro.observe(el);
      this.schedule();
    });
  }

  ngOnDestroy(): void {
    this.alive = false;
    this.ro?.disconnect();
  }

  private schedule() {
    if (!this.isBrowser || this.scheduled || !this.alive) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      if (!this.alive) return;
      this.applyClamp();
    });
  }

  private applyClamp() {
    const el = this.elRef.nativeElement;
    if (!this.original) return;

    // Reseta para original antes de medir
    el.textContent = this.original;

    const styles = getComputedStyle(el);
    const fontSize = parseFloat(styles.fontSize || '16');
    const lhRaw = styles.lineHeight;
    const lineHeight =
      lhRaw === 'normal' || !parseFloat(lhRaw)
        ? 1.35 * fontSize
        : parseFloat(lhRaw);

    const maxH = this._lines * lineHeight;

    // Já cabe inteiro? então mantém original
    if (el.scrollHeight <= maxH + 1) {
      el.textContent = this.original;
      return;
    }

    // Busca binária por quantidade de PALAVRAS que cabem
    const words = this.original.split(/\s+/u).filter(Boolean);
    let lo = 0,
      hi = words.length,
      best = '';

    const fits = (text: string) => {
      el.textContent = text;
      return el.scrollHeight <= maxH + 1;
    };

    while (lo <= hi) {
      const mid = (lo + hi) >> 1; // floor((lo+hi)/2)
      const raw = words.slice(0, mid).join(' ');
      const candidate = raw ? this.cleanTail(raw) + '…' : '…';
      if (fits(candidate)) {
        best = candidate;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Fallback mínimo (se nenhuma palavra couber)
    el.textContent = best || '…';
  }

  private cleanTail(s: string): string {
    // tira espaços à direita
    s = s.replace(/\s+$/u, '');

    // remove pontuação fraca no fim: , ; : . … - – — / \ · •
    s = s.replace(/[,\.;:…\-–—/\\·•]+$/u, '');

    // se restou um abridor pendurado (“ ( [ { < ou aspas)
    s = s.replace(/\s*[\(\[\{<"“'´`]+$/u, '');

    // de novo, caso tenha ficado outra pontuação após remover abridor
    s = s.replace(/[,\.;:…\-–—/\\·•]+$/u, '');

    return s;
  }
}
