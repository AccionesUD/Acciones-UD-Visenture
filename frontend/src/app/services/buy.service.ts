import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BuyOrder } from '../models/buy.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BuysService {
  constructor(private http: HttpClient) {}

  submitBuyOrder(order: BuyOrder): Observable<HttpResponse<any>> {
    console.log('[BuysService] Enviando orden de compra al backend:', order); // LOG para depuración
    // Mostrar ejemplo de cómo se debe enviar la petición
    console.log('[BuysService] Ejemplo de petición enviada:', {
      url: `${environment.apiUrl}/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <token>'
      },
      body: order
    });
    return this.http.post<any>(`${environment.apiUrl}/orders`, order, { observe: 'response' });
  }
}