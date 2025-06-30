import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScrollTopService {
  
  constructor(private router: Router) {
    // Nos subscribimos a los eventos de navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Cuando se completa la navegación, hacemos scroll al inicio
      this.scrollToTop();
    });
  }

  /**
   * Hace scroll a la parte superior de la página
   */
  scrollToTop(): void {
    // Comprobamos si estamos en un navegador (no server-side rendering)
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  /**
   * Método para llamar manualmente cuando sea necesario
   */
  scrollToTopManual(): void {
    this.scrollToTop();
  }
}
