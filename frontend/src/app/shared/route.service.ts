import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/test-reset-password','/portfolio'];
  
  private isAuthRouteSubject = new BehaviorSubject<boolean>(false);
  public isAuthRoute$ = this.isAuthRouteSubject.asObservable();

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // En el servidor, no necesitamos suscribirnos a los eventos de navegación
    if (isPlatformBrowser(this.platformId)) {
      // Inicializa el estado basado en la ruta actual
      this.checkIfAuthRoute(this.router.url);
      
      // Subscripción a los cambios de ruta
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          const currentUrl = event.urlAfterRedirects || event.url;
          this.checkIfAuthRoute(currentUrl);
        });
    }
  }

  /**
   * Verifica si la ruta actual es una ruta de autenticación
   */
  private checkIfAuthRoute(url: string): void {
    const isAuthRoute = this.authRoutes.some(route => url.startsWith(route));
    this.isAuthRouteSubject.next(isAuthRoute);
  }

  /**
   * Verifica si una ruta específica es una ruta de autenticación
   */
  public isAuthenticationRoute(url: string): boolean {
    return this.authRoutes.some(route => url.startsWith(route));
  }
}
