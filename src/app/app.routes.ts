import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home';
import { JogosComponent } from './pages/jogos/jogos';
import { SobreComponent } from './pages/sobre/sobre';
import { JogoDetalhesComponent } from './pages/jogos/jogo-detalhes';
import { JogosNovoComponent } from './pages/jogos/jogos-novo';
import { JogosFavoritosComponent } from './pages/jogos/jogos-favoritos';
import { LoginComponent } from './pages/login/login';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'backlog',
    loadComponent: () =>
      import('./features/backlog/backlog.page').then(m => m.BacklogPage),
  },

  { path: '', component: HomeComponent, pathMatch: 'full' },

  { path: 'jogos', component: JogosComponent },
  { path: 'jogos/novo', component: JogosNovoComponent, canActivate: [authGuard] },
  { path: 'jogos/favoritos', component: JogosFavoritosComponent },
  { path: 'jogos/:id', component: JogoDetalhesComponent },
  { path: 'sobre', component: SobreComponent },
  { path: 'login', component: LoginComponent },

  { path: '**', redirectTo: '' },
];
