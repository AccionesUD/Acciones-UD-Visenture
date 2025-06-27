import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BuyOrder } from '../models/buy.model';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BuysService {
  constructor(private http: HttpClient) {}

  submitBuyOrder(order: BuyOrder): Observable<any> {
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
    return this.http.post<any>(`${environment.apiUrl}/orders`, order, { observe: 'response' }).pipe(
      // Normalización de la respuesta para robustez
      // Si el backend responde { status: true }, lo mapeamos a { success: true }
      // Si responde { success: true }, lo dejamos igual
      // Si no, devolvemos success: false
      // El componente solo debe usar response.success
      // Además, log completo de la respuesta
      tap(resp => {
        console.log('[BuysService] Respuesta cruda del backend:', resp);
      }),
      map((resp: any) => {
        // Si la respuesta es HttpResponse, extraemos el body
        const body = resp?.body || resp;
        if (body && typeof body === 'object') {
          if (typeof body.success === 'boolean') {
            return { ...body, httpStatus: resp.status };
          } else if (typeof body.status === 'boolean') {
            return { ...body, success: body.status, httpStatus: resp.status };
          }
        }
        return { success: false, message: body?.message || 'Respuesta inesperada del servidor', data: body, httpStatus: resp.status };
      })
    );
  }
}