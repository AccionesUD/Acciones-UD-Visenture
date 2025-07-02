import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SubscriptionDialogComponent } from './subscription-dialog/subscription-dialog.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-suscription',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, MatButtonModule],
  templateUrl: './suscription.component.html',
  styleUrls: ['./suscription.component.css']
})
export class SuscriptionComponent implements OnInit {
  
  subscriptionActive = false;
  currentUser: User | null = null;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.checkSubscriptionStatus();
    });
  }

  checkSubscriptionStatus(): void {
    if (this.currentUser && this.currentUser.roles) {
      this.subscriptionActive = this.currentUser.roles.includes('usuario_premium');
    } else {
      this.subscriptionActive = false;
    }
  }

  openSubscriptionDialog(): void {
    const dialogRef = this.dialog.open(SubscriptionDialogComponent, {
      width: '800px',
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Podríamos actualizar el estado de la suscripción aquí si el diálogo devuelve un resultado
        this.checkSubscriptionStatus();
      }
    });
  }
}
