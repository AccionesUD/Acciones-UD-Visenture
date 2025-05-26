import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {
  
  constructor(
    private authService: AuthService, 
    private authState: AuthStateService,
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Si el usuario está autenticado de forma síncrona, redirigir directamente
    if (this.authService.isAuthenticated) {
      return this.router.createUrlTree(['/dashboard']);
    }
    
    // También escuchamos al observable por si hay un cambio de estado
    return this.authState.currentUser$.pipe(
      take(1),
      map(user => {
        // Si hay un usuario autenticado, redirigir al dashboard
        if (user) {
          return this.router.createUrlTree(['/dashboard']);
        }
        
        // Si no está autenticado, permitir acceso a la ruta de login/recuperación
        return true;
      })
    );
  }
}
