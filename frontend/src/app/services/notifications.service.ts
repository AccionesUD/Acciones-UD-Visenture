import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PriceAlert, NotificationSettings, UserPreferences } from '../models/notification.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener las preferencias de notificación del usuario
  getNotificationSettings(): Observable<NotificationSettings> {
    // En producción: return this.http.get<NotificationSettings>(`${this.apiUrl}/profile/notification-settings`);
    
    // Mock para desarrollo
    return of({
      id: 1,
      notify_admin_close_markets: true,
      notify_daily_summary: true,
      notify_orders_executed: true,
      notify_price_alerts: true,
      last_change_time: new Date()
    }).pipe(
      tap(settings => console.log('Notification settings loaded:', settings)),
      catchError(this.handleError<NotificationSettings>('getNotificationSettings'))
    );
  }

  // Guardar las preferencias de notificación
  saveNotificationSettings(settings: NotificationSettings): Observable<NotificationSettings> {
    // En producción: return this.http.post<NotificationSettings>(`${this.apiUrl}/profile/notification-settings`, settings);
    
    // Mock para desarrollo
    return of({
      ...settings,
      last_change_time: new Date()
    }).pipe(
      tap(updatedSettings => console.log('Notification settings saved:', updatedSettings)),
      catchError(this.handleError<NotificationSettings>('saveNotificationSettings'))
    );
  }

  // Obtener alertas de precio configuradas por el usuario
  getPriceAlerts(): Observable<PriceAlert[]> {
    // En producción: return this.http.get<PriceAlert[]>(`${this.apiUrl}/profile/price-alerts`);
    
    // Mock para desarrollo
    const mockAlerts: PriceAlert[] = [
      {
        id: 1,
        user_id: 1,
        ticker: 'AAPL',
        stock_name: 'Apple Inc.',
        target_price: 180.50,
        condition: 'above',
        active: true,
        created_at: new Date(),
        notified: false
      },
      {
        id: 2,
        user_id: 1,
        ticker: 'MSFT',
        stock_name: 'Microsoft Corporation',
        target_price: 330.75,
        condition: 'below',
        active: true,
        created_at: new Date(),
        notified: false
      }
    ];
    
    return of(mockAlerts).pipe(
      tap(alerts => console.log('Price alerts loaded:', alerts)),
      catchError(this.handleError<PriceAlert[]>('getPriceAlerts', []))
    );
  }

  // Crear una nueva alerta de precio
  createPriceAlert(alert: Partial<PriceAlert>): Observable<PriceAlert> {
    // En producción: return this.http.post<PriceAlert>(`${this.apiUrl}/profile/price-alerts`, alert);
    
    // Mock para desarrollo
    const newAlert: PriceAlert = {
      id: Math.floor(Math.random() * 1000), // ID simulado
      user_id: 1,
      ticker: alert.ticker || '',
      stock_name: alert.stock_name,
      target_price: alert.target_price || 0,
      condition: alert.condition || 'above',
      active: true,
      created_at: new Date(),
      notified: false
    };
    
    return of(newAlert).pipe(
      tap(createdAlert => console.log('Price alert created:', createdAlert)),
      catchError(this.handleError<PriceAlert>('createPriceAlert'))
    );
  }

  // Actualizar una alerta de precio existente
  updatePriceAlert(alertId: number, alert: Partial<PriceAlert>): Observable<PriceAlert> {
    // En producción: return this.http.put<PriceAlert>(`${this.apiUrl}/profile/price-alerts/${alertId}`, alert);
    
    // Mock para desarrollo
    return of({
      id: alertId,
      user_id: 1,
      ticker: alert.ticker || '',
      stock_name: alert.stock_name,
      target_price: alert.target_price || 0,
      condition: alert.condition || 'above',
      active: alert.active !== undefined ? alert.active : true,
      created_at: new Date(),
      last_notified: alert.notified ? new Date() : undefined,
      notified: alert.notified || false
    }).pipe(
      tap(updatedAlert => console.log(`Price alert ${alertId} updated:`, updatedAlert)),
      catchError(this.handleError<PriceAlert>('updatePriceAlert'))
    );
  }

  // Eliminar una alerta de precio
  deletePriceAlert(alertId: number): Observable<any> {
    // En producción: return this.http.delete<any>(`${this.apiUrl}/profile/price-alerts/${alertId}`);
    
    // Mock para desarrollo
    return of({ success: true }).pipe(
      tap(() => console.log(`Price alert ${alertId} deleted`)),
      catchError(this.handleError('deletePriceAlert'))
    );
  }

  // Manejo de errores
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retornamos un resultado vacío para permitir que la app continúe
      return of(result as T);
    };
  }
}