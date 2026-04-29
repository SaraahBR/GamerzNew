import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'backlog',
    canActivate: [authGuard], 
    loadComponent: () =>
      import('./features/backlog/backlog.page').then(m => m.BacklogPage),
  },
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
    pathMatch: 'full' 
  },
  { 
    path: 'jogos', 
    loadComponent: () => import('./pages/jogos/jogos').then(m => m.JogosComponent) 
  },
  { 
    path: 'jogos/novo', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/jogos/jogos-novo').then(m => m.JogosNovoComponent) 
  },
  { 
    path: 'jogos/favoritos', 
    loadComponent: () => import('./pages/jogos/jogos-favoritos').then(m => m.JogosFavoritosComponent) 
  },
  { 
    path: 'jogos/:id', 
    loadComponent: () => import('./pages/jogos/jogo-detalhes').then(m => m.JogoDetalhesComponent) 
  },
  { 
    path: 'sobre', 
    loadComponent: () => import('./pages/sobre/sobre').then(m => m.SobreComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) 
  },
  { path: '**', redirectTo: '' },
];
