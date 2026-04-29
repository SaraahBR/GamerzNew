import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CanvasService } from '../../services/canvas.service';

// Seletores bloqueados especificamente na Home
const HOME_EXCLUSIONS =
  '.card, .ver-mais, .btn-gradiente, .previews-head, .pill, ' +
  '.hero-pills, .btn, .hero-sub, h1, h2, h3';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private canvasSvc: CanvasService
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvasSvc.setPage(true, HOME_EXCLUSIONS);
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
  }
}
