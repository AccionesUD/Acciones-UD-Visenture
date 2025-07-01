import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './auth/token.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes, 
      withViewTransitions(),
      withInMemoryScrolling({ 
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'      
      })
    ),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor])
    ),    
    provideAnimations(), // Necesario para los diálogos de Angular Material
    importProvidersFrom(NgApexchartsModule), // Importamos NgApexchartsModule globalmente
    // Inicializar la autenticación al cargar la app
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => {
        return () => new Promise<void>((resolve) => {
          // Intentamos cargar la sesión existente
          setTimeout(() => {
            authService.loadUserFromStorage();
            resolve();
          }, 100); // Pequeño retraso para asegurar que los servicios estén listos
        });
      },
      deps: [AuthService],
      multi: true
    }
  ]
};