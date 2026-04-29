import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sobre.html',
  styleUrls: ['./sobre.css']
})
export class SobreComponent implements OnInit, OnDestroy {
  showAstroInfo = false;
  animSvc = inject(AnimationService);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private canvasSvc: CanvasService
  ) {
    // Escuta mudanças na acessibilidade global. Ao clicar no botão, fecha o modal.
    effect(() => {
      this.animSvc.enabled(); // Aciona dependência
      if (this.showAstroInfo) {
        this.showAstroInfo = false;
        this.updateBodyScroll();
      }
    });
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvasSvc.setPage(true, 'h1, .texto, .planet, .foto-centro, .nome, .titulo, .astro-info-btn, .astro-post-it');
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  toggleAstroInfo() {
    this.showAstroInfo = !this.showAstroInfo;
    this.updateBodyScroll();
  }

  private updateBodyScroll() {
    if (isPlatformBrowser(this.platformId)) {
      // Bloqueia scroll apenas na versão mobile
      if (this.showAstroInfo && window.innerWidth <= 900) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }
}