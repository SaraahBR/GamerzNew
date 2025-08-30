import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appClamp]',
  standalone: true,
})
export class ClampDirective implements AfterViewInit, OnDestroy {
  private original = '';
  private ro?: ResizeObserver;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    this.original = (node.textContent || '').trim();

    // Reaplica em próximo tick (quando o layout já tem medidas)
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.applyClamp());

      // Observa mudanças de tamanho (responsivo)
      this.ro = new ResizeObserver(() => this.applyClamp());
      this.ro.observe(node);
    });
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  private applyClamp(): void {
    const node = this.el.nativeElement;

    // Restaura texto completo antes de medir
    node.textContent = this.original;

    // Se já cabe, não faz nada
    if (node.scrollHeight <= node.clientHeight + 0.5) return;

    // Binary search para achar maior trecho que cabe
    let lo = 0;
    let hi = this.original.length;

    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      node.textContent = this.original.slice(0, mid).trimEnd();
      if (node.scrollHeight <= node.clientHeight + 0.5) lo = mid;
      else hi = mid - 1;
    }

    // Corta na última palavra inteira e adiciona “…”
    let cut = this.original.slice(0, lo).replace(/\s+\S*$/, '').trimEnd();

    // Garante que continue cabendo após adicionar a elipse
    node.textContent = cut + '…';
    while (node.scrollHeight > node.clientHeight + 0.5 && cut.length > 0) {
      cut = cut.replace(/\s*\S+$/, '').trimEnd();
      node.textContent = (cut ? cut + '…' : '…');
    }

    // Dica de acessibilidade (texto completo ao passar o mouse)
    if (!node.getAttribute('title')) {
      node.setAttribute('title', this.original);
    }
  }
}
