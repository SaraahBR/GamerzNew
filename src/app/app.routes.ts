import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { JogosComponent } from './pages/jogos/jogos.component';
import { SobreComponent } from './pages/sobre/sobre.component';
import { JogoDetalhesComponent } from './pages/jogos/jogo-detalhes.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'jogos', component: JogosComponent },
  { path: 'jogos/:id', component: JogoDetalhesComponent },
  { path: 'sobre', component: SobreComponent },
  { path: '**', redirectTo: '' }
];
