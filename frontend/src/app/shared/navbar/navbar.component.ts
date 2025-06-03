import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStateService } from '../../services/auth-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  username: string | null = null;
  mobileMenuOpen = false;
  sidebarOpen = false;
  isDarkTheme = false;
  isLoading = true; // Estado de carga para controlar la visualización
  private authSubscription: Subscription = new Subscription();
  
  // Verifica si estamos en el navegador
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
  constructor(
    private authService: AuthService,
    private authState: AuthStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (this.isBrowser) {
      // Inicializar el estado del tema basado en localStorage o preferencia del sistema
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        this.isDarkTheme = storedTheme === 'dark';
      } else {
        // Usar preferencia del sistema
        this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      // Aplicar el tema inicial
      if (this.isDarkTheme) {
        document.documentElement.classList.add('dark');
      }
    }
  }
  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.isLoading = true;
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.isAuthenticated = !!user;
        this.username = user?.username || null;
        this.isLoading = false; // Terminamos de cargar cuando tengamos datos de autenticación
      },
      error: (err) => {
        console.error('Error al obtener el usuario actual:', err);
        this.isLoading = false;
      }
    });
  }
  
  ngOnDestroy(): void {
    // Limpiamos la suscripción para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleTheme(): void {
    if (!this.isBrowser) return;

    // Cambiar el tema
    this.isDarkTheme = !this.isDarkTheme;

    if (this.isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.sidebarOpen = false; // Cerrar sidebar al hacer logout
    this.authService.logout();
  }

  // Método para navegar y cerrar sidebar automáticamente
  navigateAndClose(): void {
    this.sidebarOpen = false;
    // Comentario: Método simplificado para cerrar el sidebar al navegar
  }
}
