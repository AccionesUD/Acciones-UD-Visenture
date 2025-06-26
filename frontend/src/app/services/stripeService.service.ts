import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StripeService {
  constructor(private http: HttpClient) {}

  // Simula la redirección a Stripe Checkout
  createCheckoutSession(): Observable<string> {
    // En producción: return this.http.post<string>('tu_api/crear_sesion', {...});
    return of('https://checkout.stripe.com/pay/mock-session-id'); // Mock URL
  }

  // Simula la cancelación de suscripción
  cancelSubscription(): Observable<void> {
    // En producción: return this.http.post<void>('tu_api/cancelar_suscripcion', {...});
    return of(void 0); // Mock
  }
}
