import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './auth/token.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { catchError, throwError } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),    provideClientHydration(),    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor])
    ),
    provideAnimations(), // Necesario para los diálogos de Angular Material
    // Inicializar la aplicación cliente
  ]
};
