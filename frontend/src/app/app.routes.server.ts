import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas de autenticación - No usar SSR para estas rutas
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'forgot-password',
    renderMode: RenderMode.Client
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Client
  },
  {
    path: 'test-reset-password',
    renderMode: RenderMode.Client
  },
  // Rutas protegidas - No usar SSR para estas rutas
  {
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  // Ruta de inicio - Prerender
  {
    path: 'home',
    renderMode: RenderMode.Prerender
  },
  // Ruta predeterminada - Prerender
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  // El resto de rutas - Usar renderizado del lado del cliente
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
