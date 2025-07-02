import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentsService, PreferenceRequest } from '../../../services/payments.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.model';

// Define la estructura de un plan de suscripción
export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './subscription-dialog.component.html',
  styleUrls: ['./subscription-dialog.component.css']
})
export class SubscriptionDialogComponent implements OnInit {
  
  plans: SubscriptionPlan[] = [
    {
      id: 1,
      name: 'Plan Básico',
      price: 15000,
      description: 'Acceso a las funcionalidades esenciales para empezar a invertir.',
      features: ['Análisis de mercado básico', 'Portafolio con hasta 10 acciones', 'Soporte por correo']
    },
    {
      id: 2,
      name: 'Plan Premium',
      price: 45000,
      description: 'Desbloquea todo el potencial de la plataforma con herramientas avanzadas.',
      features: ['Análisis avanzado en tiempo real', 'Portafolios ilimitados', 'Asesoría personalizada', 'Soporte prioritario 24/7']
    }
  ];

  isProcessing = false;
  currentUser: User | null = null;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private paymentsService: PaymentsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (!this.currentUser || !this.currentUser.email) {
      this.snackBar.open('No se pudo obtener la información del usuario para el pago.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.isProcessing = true;
    const preferenceData: PreferenceRequest = {
      planId: plan.id,
      monto: plan.price,
      descripcion: `Suscripción al ${plan.name}`,
      emailUsuario: this.currentUser.email
    };

    this.paymentsService.crearPreferencia(preferenceData).subscribe({
      next: (response) => {
        // Redirigir a la URL de pago de Mercado Pago
        window.location.href = response.init_point;
      },
      error: (error) => {
        this.isProcessing = false;
        this.snackBar.open('Error al crear la preferencia de pago. Por favor, intenta de nuevo.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Error al crear preferencia:', error);
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}