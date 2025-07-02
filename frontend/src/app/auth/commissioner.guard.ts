import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class CommissionerGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // Verifica si el usuario está autenticado
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    
    // Verifica si el usuario tiene el rol de comisionista o admin
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.roles && (currentUser.roles.includes('comisionista') || currentUser.roles.includes('admin'))) {
      return true;
    }
    
    // Si no es comisionista, muestra un mensaje y redirecciona
    this.snackBar.open('No tienes permisos para acceder a esta sección', 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    this.router.navigate(['/dashboard']);
    return false;
  }
}
