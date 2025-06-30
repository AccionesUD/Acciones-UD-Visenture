import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Si el usuario está autenticado, redirigir al home
        if (user) {
          console.log('Usuario ya autenticado, redirigiendo al home');
          return this.router.createUrlTree(['/']);
        }
        // Si no está autenticado, permitir acceso a login/register
        return true;
      })
    );
  }
}
