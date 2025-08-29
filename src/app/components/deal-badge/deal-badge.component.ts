import { Component, Input, OnInit, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ItadService, ItadOffer } from '../../services/itad.service';
import { map, of, Observable, tap, catchError } from 'rxjs';

@Component({
  selector: 'app-deal-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-badge.component.html',
  styleUrls: ['./deal-badge.component.css'],
})
export class DealBadgeComponent implements OnInit {
  @Input({ required: true }) title!: string;

  vm$: Observable<ItadOffer | null> = of(null);
  ready = false;

  constructor(
    private itad: ItadService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.vm$ = this.itad.bestOffer(this.title).pipe(
        map(o => o ?? null),
        tap(() => (this.ready = true)),
        catchError(() => { this.ready = true; return of(null); })
      );
    } else {
      this.vm$ = of(null);
      this.ready = true;
    }
  }
}
