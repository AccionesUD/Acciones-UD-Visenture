import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { AuthStateService } from '../auth/auth-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  constructor(
    private authState: AuthStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si hay un usuario autenticado, redirigir a mercados o home
    if (this.authState.isAuthenticated) {
      this.router.navigate(['/mercados']).catch(() => {
        // Si la ruta no existe, redirigir al home
        this.router.navigate(['/home']);
      });
    }
  }
}
