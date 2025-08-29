import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GamesService } from '../../services/games.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private games = inject(GamesService);
  private router = inject(Router);

  user$ = this.auth.user$;

  async logout() {
    await this.auth.logout();
    await this.games.refresh(); 
    this.router.navigateByUrl('/');
  }
}
