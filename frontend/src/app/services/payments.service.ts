import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PreferenceRequest {
  planId: number;
  monto: number;
  descripcion: string;
  emailUsuario: string;
}

export interface PreferenceResponse {
  init_point: string;
  id: string;
}

export interface SubscriptionConfirmationRequest {
  planId: number;
  paymentToken: string; // Aunque simulado, lo mantenemos por ahora
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) { }

  /**
   * Crea una preferencia de pago en Mercado Pago.
   * @param data - Datos para crear la preferencia.
   * @returns Un Observable con la URL de pago (init_point) y el ID de la preferencia.
   */
  crearPreferencia(data: PreferenceRequest): Observable<PreferenceResponse> {
    return this.http.post<PreferenceResponse>(`${this.apiUrl}/crear-preferencia`, data);
  }

  /**
   * Confirma la suscripción después de un pago exitoso.
   * @param data - Datos de confirmación de la suscripción.
   * @returns Un Observable con el resultado de la suscripción.
   */
  confirmarSuscripcion(data: SubscriptionConfirmationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscribe`, data);
  }
}