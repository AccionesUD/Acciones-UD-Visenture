import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { AdminAnalyticsData } from '../models/admin-analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los usuarios con sus roles.
   * Requiere rol de 'admin'.
   */
  getUsersWithRoles(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/accounts`).pipe(
      catchError(this.handleError<User[]>('getUsersWithRoles', []))
    );
  }

  getAdminAnalytics(): Observable<AdminAnalyticsData> {
    // Mock data for testing purposes
    const mockData: AdminAnalyticsData = {
      qty_orders_total: 30,
      qty_orders_fill: 10,
      qty_orders_in_procces: 2,
      qty_order_sell: 5,
      qty_order_buy: 25,
      qty_recharges_in_accounts: 16,
      total_recharge_app: 23428.3,
      total_commission_app: 0,
      total_assets_in_briefcases: 6,
      qty_shares_in_operation: 4,
      qty_accounts_standard: 1,
      qty_account_commission: 0
    };

    // return this.http.get<AdminAnalyticsData>(`${this.apiUrl}/admin-analytics`).pipe(
    //   catchError(this.handleError<AdminAnalyticsData>('getAdminAnalytics', {} as AdminAnalyticsData))
    // );
    return of(mockData); // Return mock data as an observable
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