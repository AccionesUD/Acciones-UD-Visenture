import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
  addFunds(amount: number): Observable<any> {
    // Llamada real al backend para fondeo
    return this.http.post<any>(`${this.apiUrl}/accounts/funding`, { amountTranfer: amount }).pipe(
      tap(response => {
        console.log('Respuesta de fondeo:', response);
      }),
      catchError(this.handleError<any>('addFunds'))
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
