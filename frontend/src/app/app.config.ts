import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withFetch(), 
    ),
    provideAnimations(), // Necesario para los diálogos de Angular Material
    // Inicializar la aplicación cliente
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        return () => {
          console.log('Client-side application initialized');
        };
      },
      multi: true
    }
  ]
};
