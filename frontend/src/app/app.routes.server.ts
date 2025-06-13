import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
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
    path: 'home',
    renderMode: RenderMode.Client
  },

  {
    path: '',
    renderMode: RenderMode.Client
  },

  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
