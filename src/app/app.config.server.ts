import { mergeApplicationConfig, ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),

    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
