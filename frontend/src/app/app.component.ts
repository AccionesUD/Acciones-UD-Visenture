import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { RouteService } from './shared/route.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'visenture_frontend';
  showNavbar = true;
  private routeSubscription?: Subscription;

  constructor(
    private routeService: RouteService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  ngOnInit() {
    // Solo suscribirse a los eventos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Inicializar el tema al cargar la aplicación
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
      }

      // Escuchar cambios en la preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      });

      // Suscribirse a los cambios de ruta mediante el servicio
      this.routeSubscription = this.routeService.isAuthRoute$.subscribe(isAuthRoute => {
        this.showNavbar = !isAuthRoute;
      });
    } else {
      // En el servidor, por defecto mostramos el navbar
      this.showNavbar = true;
    }
  }
  
  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
