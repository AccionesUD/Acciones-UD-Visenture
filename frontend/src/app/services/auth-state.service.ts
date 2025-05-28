import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/auth.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // La inicialización se maneja completamente desde AuthService
    // para evitar comportamientos inconsistentes
  }

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
  updateUser(user: User | null): void {
    this.currentUserSubject.next(user);
    if (isPlatformBrowser(this.platformId)) {
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
      } else {
        localStorage.removeItem('user_data');
      }
    }
  }
  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user: User = JSON.parse(userData);
          this.currentUserSubject.next(user);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
        localStorage.removeItem('user_data');
      }
    }
  }

  // Métodos para control de roles
  hasRole(role: string): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Método para navegar después de login exitoso
  navigateToDefaultPage(): void {
    const user = this.currentUserSubject.value;
    if (user) {
      // Navegar según el rol del usuario si es necesario
      if (user.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      // Si no hay usuario, ir al home
      this.router.navigate(['/home']);
    }
  }
}