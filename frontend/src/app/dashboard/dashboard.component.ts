import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  mostrarModal: boolean = true;

  constructor(private router: Router) {}

  irAConfiguracion() {
    this.router.navigate(['/configuracion']); // Ajustar la ruta cuando hayamos ajustado ese modulo.
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
  
  irAPreferencias() {
  this.router.navigate(['/preferencias']);
  }


}
