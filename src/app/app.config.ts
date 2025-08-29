import { ApplicationConfig, APP_INITIALIZER, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AuthService } from './services/auth.service';

function initAuthFactory() {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  return () => {
    if (isPlatformBrowser(platformId)) {
      return auth.me().catch(() => {});
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: APP_INITIALIZER, useFactory: initAuthFactory, multi: true },
  ],
};
