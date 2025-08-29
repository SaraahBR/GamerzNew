import { Component, Input, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Observable, of, catchError, timeout, finalize, tap } from 'rxjs';
import { ItadService, ItadOffer } from '../../services/itad.service';

@Component({
  selector: 'app-deal-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-badge.component.html',
  styleUrls: ['./deal-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DealBadgeComponent implements OnInit {
  /** Título do jogo */
  @Input({ required: true }) title!: string;

  /** URL da Steam */
  @Input() steam?: string;

  /** País preferido; o seu /api/itad já faz fallback para US se BR vier vazio */
  @Input() country: 'BR' | 'US' = 'BR';
  @Input() compact = true;

  /** Fluxo com a melhor oferta (ou null) */
  vm$: Observable<ItadOffer | null> = of(null);

  /** Controla o skeleton */
  loading = true;

  constructor(
    private itad: ItadService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // SSR-safe: não dispara HTTP no servidor
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      this.vm$ = of(null);
      return;
    }

    const src$ = this.steam
      ? this.itad.bestOfferForGame({ title: this.title, steam: this.steam }, { country: this.country })
      : this.itad.bestOffer(this.title, { country: this.country });

    this.vm$ = src$.pipe(
      timeout(10_000),                 
      catchError(() => of(null)),     
      tap(() => (this.loading = false)),
      finalize(() => (this.loading = false))
    );
  }
}
