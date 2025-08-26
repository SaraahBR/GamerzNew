import { RenderMode, ServerRoute } from '@angular/ssr';
import { GAMES } from './pages/jogos/games.data';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'jogos/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      return GAMES.map(g => ({ id: String(g.id) }));
    },
  },

  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
