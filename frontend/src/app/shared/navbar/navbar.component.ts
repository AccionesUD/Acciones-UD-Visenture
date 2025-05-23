import { Component, OnInit, PLATFORM_ID, Inject, Renderer2 } from '@angular/core';
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
  isAuthenticated = false;
  username: string | null = null;
  mobileMenuOpen = false;
  sidebarOpen = false;
  hoverSidebar = false;
  isDarkTheme = false;
  
  constructor(
    private authService: AuthService,
    private authState: AuthStateService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}    ngOnInit(): void {
    this.authState.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.username = user?.username || null;
    });
    
    // Inicializar tema desde localStorage si existe, por defecto usar modo claro
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      // Si no hay tema guardado, usar modo claro por defecto
      this.isDarkTheme = savedTheme === 'dark' ? true : false;
      this.applyTheme();
    }
  }
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
      this.applyTheme();
    }
  }
  
  private applyTheme(): void {
    if (this.isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
    logout(): void {
    // Usamos el método logout de AuthService que se encarga de limpiar tokens y estado
    this.authService.logout();
  }
}
