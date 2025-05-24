import { mergeApplicationConfig, ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// Configuración específica para el servidor
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    // Proveedor para inicializar servicios específicos en el servidor
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        // Aquí podemos inicializar cosas específicas del servidor
        return () => {
          console.log('Server-side rendering initialized');
        };
      },
      multi: true
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
