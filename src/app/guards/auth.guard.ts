import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/ui/toast.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toasts = inject(ToastService);

  // Garante que temos o usuário carregado
  try { await auth.me(); } catch { /* ignora */ }

  // Se já está logada, libera
  if (auth.snapshot) return true;

  // Notificação bonitinha (somente no browser)
  if (typeof window !== 'undefined') {
    toasts.danger('Você precisa estar logado para adicionar/alterar jogos.', {
      title: 'Atenção',
      timeout: 4500,
    });
  }

  // Volta para onde a pessoa tentou ir depois do login
  const from = state?.url || '/';
  return router.createUrlTree(['/login'], {
    queryParams: { from, reason: 'login_required' },
  });
};
