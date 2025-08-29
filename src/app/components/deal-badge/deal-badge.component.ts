import { Component, Input, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Observable, of, catchError, timeout, startWith, shareReplay } from 'rxjs';
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
  /** URL da Steam (para extrair appid e melhorar o match) */
  @Input() steam?: string;
  /** País preferido */
  @Input() country: 'BR' | 'US' = 'BR';
  /** Versão compacta para usar no card da listagem */
  @Input() compact = true;

  vm$: Observable<ItadOffer | null | undefined> = of(undefined);

  constructor(
    private itad: ItadService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.vm$ = of(null);
      return;
    }

    const base$ = this.steam
      ? this.itad.bestOfferForGame({ title: this.title, steam: this.steam }, { country: this.country })
      : this.itad.bestOffer(this.title, { country: this.country });

    this.vm$ = base$.pipe(
      timeout(10_000),              
      catchError(() => of(null)),   
      startWith(undefined),         
      shareReplay({ bufferSize: 1, refCount: true }) 
    );
  }
}
