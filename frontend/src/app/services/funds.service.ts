import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaymentResponse } from '../models/payment.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class FundsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${environment.apiUrl}/accounts/transactions`);
  }
  
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