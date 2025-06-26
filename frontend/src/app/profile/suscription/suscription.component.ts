import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { Component } from '@angular/core';
import { StripeService } from '../../services/stripeService.service';


@Component({
  selector: 'app-suscription',
  imports: [CommonModule,MatIcon],
  templateUrl: './suscription.component.html',
  styleUrl: './suscription.component.css'
})
export class SuscriptionComponent {


subscriptionActive = false;
  isProcessing = false;

  // Controla si usar Stripe real o mock
  useMockMode = true;

  constructor(private stripeService: StripeService) {}

  toggleSubscription(): void {
    this.isProcessing = true;

    if (this.subscriptionActive) {
      this.cancelSubscription();
    } else {
      this.activateSubscription();
    }
  }

  activateSubscription(): void {
    if (this.useMockMode) {
      setTimeout(() => {
        this.subscriptionActive = true;
        this.isProcessing = false;
        console.log('Suscripción activada (mock)');
      }, 1500);
    } else {
      this.stripeService.createCheckoutSession().subscribe({
        next: sessionUrl => {
          window.location.href = sessionUrl;
        },
        error: () => {
          this.isProcessing = false;
          console.error('Error al iniciar sesión de Stripe.');
        }
      });
    }
  }

  cancelSubscription(): void {
    if (this.useMockMode) {
      setTimeout(() => {
        this.subscriptionActive = false;
        this.isProcessing = false;
        console.log('Suscripción cancelada (mock)');
      }, 1000);
    } else {
      this.stripeService.cancelSubscription().subscribe({
        next: () => {
          this.subscriptionActive = false;
          this.isProcessing = false;
        },
        error: () => {
          this.isProcessing = false;
          console.error('Error al cancelar suscripción real.');
        }
      });
    }
  }

}
