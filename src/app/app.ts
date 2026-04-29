import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastContainerComponent } from './shared/ui/toast-container.component';
import { GalaxyCanvasComponent } from './components/galaxy-canvas/galaxy-canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastContainerComponent,
    GalaxyCanvasComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
