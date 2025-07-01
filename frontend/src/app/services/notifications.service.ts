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
    return this.http.get<NotificationSettings>(`${this.apiUrl}/profile/notification-settings`).pipe(
      tap(settings => console.log('Notification settings loaded:', settings)),
      catchError(this.handleError<NotificationSettings>('getNotificationSettings'))
    );
  }

  // Guardar las preferencias de notificación
  saveNotificationSettings(settings: NotificationSettings): Observable<NotificationSettings> {
    return this.http.post<NotificationSettings>(`${this.apiUrl}/profile/notification-settings`, settings).pipe(
      tap(updatedSettings => console.log('Notification settings saved:', updatedSettings)),
      catchError(this.handleError<NotificationSettings>('saveNotificationSettings'))
    );
  }

  // Obtener alertas de precio configuradas por el usuario
  getPriceAlerts(): Observable<PriceAlert[]> {
    return this.http.get<PriceAlert[]>(`${this.apiUrl}/profile/price-alerts`).pipe(
      tap(alerts => console.log('Price alerts loaded:', alerts)),
      catchError(this.handleError<PriceAlert[]>('getPriceAlerts', []))
    );
  }

  // Crear una nueva alerta de precio
  createPriceAlert(alert: Partial<PriceAlert>): Observable<PriceAlert> {
    return this.http.post<PriceAlert>(`${this.apiUrl}/profile/price-alerts`, alert).pipe(
      tap(createdAlert => console.log('Price alert created:', createdAlert)),
      catchError(this.handleError<PriceAlert>('createPriceAlert'))
    );
  }

  // Actualizar una alerta de precio existente
  updatePriceAlert(alertId: number, alert: Partial<PriceAlert>): Observable<PriceAlert> {
    return this.http.put<PriceAlert>(`${this.apiUrl}/profile/price-alerts/${alertId}`, alert).pipe(
      tap(updatedAlert => console.log(`Price alert ${alertId} updated:`, updatedAlert)),
      catchError(this.handleError<PriceAlert>('updatePriceAlert'))
    );
  }

  // Eliminar una alerta de precio
  deletePriceAlert(alertId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/profile/price-alerts/${alertId}`).pipe(
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
