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
  getAccountBalance(): Observable<AccountBalance> {
    // En producción: return this.http.get<AccountBalance>(`${this.apiUrl}/account/balance`);
    
    // Mock para desarrollo
    return of({
      id: 1,
      user_id: 1,
      balance: 5000.00,
      available_balance: 4200.00,
      pending_funds: 800.00,
      currency: 'USD',
      last_deposit: {
        amount: 1000.00,
        date: new Date(new Date().setDate(new Date().getDate() - 3)),
        status: 'completed'
      },
      updated_at: new Date()
    } as AccountBalance).pipe(
      tap(balance => console.log('Account balance loaded:', balance)),
      catchError(this.handleError<AccountBalance>('getAccountBalance'))
    );
  }

  /**
   * Añade fondos a la cuenta del usuario
   */
  addFunds(request: AddFundsRequest): Observable<PaymentResponse> {
    // En producción: return this.http.post<PaymentResponse>(`${this.apiUrl}/account/add-funds`, request);
    
    // Mock para desarrollo
    return of({
      success: true,
      message: 'Fondos añadidos correctamente',
      payment: {
        id: Math.floor(Math.random() * 1000) + 1,
        amount: request.amount,
        description: request.description || 'Depósito de fondos',
        status: 'pending',
        date_created: new Date(),
      }
    } as PaymentResponse).pipe(
      tap(response => console.log('Funds added:', response)),
      catchError(this.handleError<PaymentResponse>('addFunds'))
    );
  }

  /**
   * Obtiene el historial de pagos del usuario
   */
  getPaymentsHistory(page: number = 1, limit: number = 10): Observable<Payment[]> {
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
