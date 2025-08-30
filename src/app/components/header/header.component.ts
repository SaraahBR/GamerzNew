import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GamesService } from '../../services/games.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private games = inject(GamesService);
  private router = inject(Router);

  user$ = this.auth.user$;
  menuOpen = false;

  private sub?: Subscription;

  ngOnInit(): void {
    // Fecha o menu quando a rota muda 
    this.sub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) this.menuOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  // Fecha com ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    this.menuOpen = false;
  }

  // Se a tela foi redimensionada para desktop, garante menu fechado
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 960 && this.menuOpen) {
      this.menuOpen = false;
    }
  }

  async logout() {
    await this.auth.logout();
    await this.games.refresh();
    this.router.navigateByUrl('/');
  }
}
