import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AuthStateService } from '../../auth/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;  username: string | null = null;
  mobileMenuOpen = false;
  sidebarOpen = false;
  isDarkTheme = false;
  
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
    this.authState.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.username = user?.username || null;
    });
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
