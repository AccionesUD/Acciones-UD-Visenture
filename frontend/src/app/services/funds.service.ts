import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AccountBalance, AddFundsRequest, Payment, PaymentResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class FundsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el saldo actual de la cuenta del usuario
   */
  getAccountBalance(): Observable<any> {
    // Llamada real al backend para ver la estructura del balance
    return this.http.get<any>(`${this.apiUrl}/accounts/balance`).pipe(
      tap(balance => {
        console.log('Balance recibido del backend:', balance);
      }),
      catchError(this.handleError<any>('getAccountBalance'))
    );
  }

  /**
   * Añade fondos a la cuenta del usuario
   */
  addFunds(amount: number): Observable<PaymentResponse> {
    // Llamada real al backend para fondeo
    return this.http.post<any>(`${this.apiUrl}/accounts/funding`, { amountTranfer: amount }).pipe(
      tap(response => {
        console.log('[FundsService] Respuesta de fondeo:', response);
      }),
      // Mapeo robusto: acepta 'succes' o 'success' y normaliza la respuesta
      // para que el componente solo use 'success'
      // Si la respuesta es null o no tiene success, se fuerza a error
      // Se mantiene el resto de campos (message, data, etc)
      // Si la respuesta es un error HTTP, se maneja en catchError
      // Si la respuesta es un objeto, se normaliza
      // Si no, se retorna un error genérico
      // El componente solo debe usar response.success
      //
      // Nota: PaymentResponse debe tener success: boolean, message: string, data?: any
      //
      // Si el backend responde 'succes', lo mapeamos a 'success'
      // Si responde 'success', lo dejamos igual
      // Si no responde ninguno, devolvemos success: false
      //
      // El catchError ya retorna un objeto con success: false
      //
      // Usamos map de rxjs
      map((resp: any) => {
        if (resp && typeof resp === 'object') {
          if (typeof resp.success === 'boolean') {
            return resp;
          } else if (typeof resp.succes === 'boolean') {
            return { ...resp, success: resp.succes };
          } else {
            return { success: false, message: resp.message || 'Respuesta inesperada del servidor', data: resp };
          }
        }
        return { success: false, message: 'Respuesta inválida del servidor', data: resp };
      }),
      catchError(error => {
        console.error('[FundsService] Error en addFunds:', error);
        return this.handleError<PaymentResponse>('addFunds')({ success: false, message: 'Error en la transacción', data: error });
      })
    );
  }

  /**
   * Obtiene el historial de pagos del usuario
   */
  /**getPaymentsHistory(page: number = 1, limit: number = 10): Observable<Payment[]> {
    // En producción: return this.http.get<Payment[]>(`${this.apiUrl}/account/payments?page=${page}&limit=${limit}`);
    
    // Mock para desarrollo
    return of([
      {
        id: 1,
        amount: 1000,
        status: 'completed',
        description: 'Depósito inicial',
        date_created: new Date(new Date().setDate(new Date().getDate() - 30)),
        date_payment: new Date(new Date().setDate(new Date().getDate() - 29))
      },
      {
        id: 2,
        amount: 500,
        status: 'completed',
        description: 'Recarga de fondos',
        date_created: new Date(new Date().setDate(new Date().getDate() - 20)),
        date_payment: new Date(new Date().setDate(new Date().getDate() - 19))
      },
      {
        id: 3,
        amount: 800,
        status: 'pending',
        description: 'Depósito para trading',
        date_created: new Date(new Date().setDate(new Date().getDate() - 2))
      }
    ] as Payment[]).pipe(
      tap(payments => console.log('Payments history loaded:', payments)),
      catchError(this.handleError<Payment[]>('getPaymentsHistory', []))
    );
  }**/

  /**
   * Maneja errores HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Muestra el error por consola pero permite que la aplicación siga funcionando
      return of(result as T);
    };
  }
}