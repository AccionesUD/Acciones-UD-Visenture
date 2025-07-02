import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStateService } from '../../services/auth-state.service';
import { Subscription } from 'rxjs';
import { User } from '../../models/auth.model';

// Declara la función global para que TypeScript la reconozca
declare function changeAppLanguage(lang: string): void;

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
  isLoading = true;
  isCommissioner = false;
  isAdmin = false;
  isPremium = false;

  showLanguageMenu = false;
  currentLanguage = 'es';
  
  private authSubscription: Subscription = new Subscription();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor(
    private authService: AuthService,
    private authState: AuthStateService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (this.isBrowser) {
      const storedTheme = localStorage.getItem('theme');
      // FIX: Usar la clave correcta de localStorage para el idioma
      this.currentLanguage = localStorage.getItem('preferred-language') || 'es';

      if (storedTheme) {
        this.isDarkTheme = storedTheme === 'dark';
      } else {
        this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      if (this.isDarkTheme) {
        document.documentElement.classList.add('dark');
      }
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.isAuthenticated = !!user;
        this.username = user?.username || null;
        if (user && user.roles) {
          this.isCommissioner = user.roles.includes('comisionista') || user.roles.includes('admin');
          this.isAdmin = user.roles.includes('admin');
          this.isPremium = user.roles.includes('usuario_premium');
        } else {
          this.isCommissioner = false;
          this.isAdmin = false;
          this.isPremium = false;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener el usuario actual:', err);
        this.isLoading = false;
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleTheme(): void {
    if (!this.isBrowser) return;

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
    this.sidebarOpen = false;
    this.authService.logout();
  }

  navigateAndClose(): void {
    this.sidebarOpen = false;
  }

  changeLanguage(lang: string): void {
    if (this.isBrowser) {
      console.log(`🌍 User changing language to: ${lang}`);
      this.showLanguageMenu = false;
      // Llama a la función global que recargará la aplicación
      changeAppLanguage(lang);
    }
  }

  toggleLanguageMenu(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  getLanguageDisplayName(locale: string): string {
    switch (locale) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'fr': return 'Français';
      case 'ru': return 'Русский';
      default: return locale;
    }
  }
}
