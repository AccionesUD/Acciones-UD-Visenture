import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
  paymentStatus: string | null = null;
  message: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentStatus = params['status'];
      if (this.paymentStatus === 'success') {
        this.message = '¡Tu pago ha sido procesado exitosamente! Gracias por tu suscripción.';
      } else if (this.paymentStatus === 'failure') {
        this.message = 'Hubo un problema con tu pago. Por favor, inténtalo de nuevo o contacta a soporte.';
      } else {
        this.message = 'Estado de pago desconocido. Por favor, verifica tu transacción.';
      }
    });
  }
}
