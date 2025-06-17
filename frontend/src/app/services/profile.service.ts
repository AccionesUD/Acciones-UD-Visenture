import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { UserPreferences } from '../models/notification.model';
import { environment } from '../../Enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }
  // Obtener las preferencias del usuario
  getUserPreferences(): Observable<UserPreferences> {
    // En producción: return this.http.get<UserPreferences>(`${this.apiUrl}/profile/preferences`);
    
    // Mock para desarrollo
    return of({
      id: 1,
      id_account: 1,
      id_setting_notification: 1,
      id_setting_operation: 1,
      id_setting_briefcase: 1,
      language: 'es',
      favorite_markets: ['NYSE', 'NASDAQ', 'TSE'],
      favorite_sectors: ['Technology', 'Finance'],
      default_order_type: 'market',
      daily_operations_limit: 5,
      confirm_large_orders: true,
      notification_methods: {
        email: true,
        push: true,
        sms: false,
        whatsapp: false
      }
    } as UserPreferences).pipe(
      tap(prefs => console.log('User preferences loaded:', prefs)),
      catchError(this.handleError<UserPreferences>('getUserPreferences'))
    );
  }
  // Guardar preferencias del usuario
  saveUserPreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    // En producción: return this.http.post<UserPreferences>(`${this.apiUrl}/profile/preferences`, preferences);
    
    // Mock para desarrollo
    // Simulamos la respuesta del servidor, combinando los valores actuales con los nuevos
    return this.getUserPreferences().pipe(
      map(currentPrefs => {
        const updatedPrefs = { ...currentPrefs, ...preferences };
        console.log('User preferences updated:', updatedPrefs);
        return updatedPrefs;
      }),
      catchError(this.handleError<UserPreferences>('saveUserPreferences'))
    );
  }

  // Obtener información del perfil del usuario
  getUserProfileInfo(): Observable<any> {
    // En producción: return this.http.get<any>(`${this.apiUrl}/profile`);
    
    // Mock para desarrollo
    return of({
      id: 1,
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '123-456-7890',
      created_at: '2023-01-15',
      subscription_type: 'Premium',
      broker: 'XYZ Investments'
    }).pipe(
      tap(profile => console.log('User profile loaded:', profile)),
      catchError(this.handleError<any>('getUserProfileInfo'))
    );
  }
  // Actualizar información del perfil
  updateProfileInfo(profileData: any): Observable<any> {
    // En producción: return this.http.put<any>(`${this.apiUrl}/profile`, profileData);
    
    // Mock para desarrollo
    return of({
      ...profileData,
      updated_at: new Date().toISOString()
    }).pipe(
      tap(profile => console.log('Profile updated:', profile)),
      catchError(this.handleError<any>('updateProfileInfo'))
    );
  }
  // Obtener lista de tickers disponibles
  getAvailableTickers(): Observable<{ticker: string, name: string}[]> {
    // En producción: return this.http.get<{ticker: string, name: string}[]>(`${this.apiUrl}/market/tickers`);
    
    // Mock para desarrollo con lista expandida
    const mockTickers = [
      // Tecnología
      {ticker: 'AAPL', name: 'Apple Inc.'},
      {ticker: 'MSFT', name: 'Microsoft Corporation'},
      {ticker: 'GOOGL', name: 'Alphabet Inc.'},
      {ticker: 'AMZN', name: 'Amazon.com Inc.'},
      {ticker: 'META', name: 'Meta Platforms Inc.'},
      {ticker: 'TSLA', name: 'Tesla Inc.'},
      {ticker: 'NVDA', name: 'NVIDIA Corporation'},
      {ticker: 'INTC', name: 'Intel Corporation'},
      {ticker: 'CSCO', name: 'Cisco Systems Inc.'},
      {ticker: 'CRM', name: 'Salesforce Inc.'},
      {ticker: 'NFLX', name: 'Netflix Inc.'},
      {ticker: 'ADBE', name: 'Adobe Inc.'},
      {ticker: 'IBM', name: 'International Business Machines Corp.'},
      
      // Finanzas
      {ticker: 'JPM', name: 'JPMorgan Chase & Co.'},
      {ticker: 'V', name: 'Visa Inc.'},
      {ticker: 'MA', name: 'Mastercard Inc.'},
      {ticker: 'BAC', name: 'Bank of America Corp.'},
      {ticker: 'WFC', name: 'Wells Fargo & Co.'},
      {ticker: 'GS', name: 'Goldman Sachs Group Inc.'},
      {ticker: 'C', name: 'Citigroup Inc.'},
      
      // Consumo
      {ticker: 'WMT', name: 'Walmart Inc.'},
      {ticker: 'PG', name: 'Procter & Gamble Co.'},
      {ticker: 'KO', name: 'The Coca-Cola Company'},
      {ticker: 'PEP', name: 'PepsiCo Inc.'},
      {ticker: 'MCD', name: 'McDonald\'s Corp.'},
      {ticker: 'SBUX', name: 'Starbucks Corp.'},
      {ticker: 'DIS', name: 'The Walt Disney Company'},
      {ticker: 'NKE', name: 'Nike Inc.'},
      
      // Salud
      {ticker: 'JNJ', name: 'Johnson & Johnson'},
      {ticker: 'PFE', name: 'Pfizer Inc.'},
      {ticker: 'UNH', name: 'UnitedHealth Group Inc.'},
      {ticker: 'MRK', name: 'Merck & Co Inc.'},
      {ticker: 'ABBV', name: 'AbbVie Inc.'},
      {ticker: 'LLY', name: 'Eli Lilly and Company'},
      
      // Energía
      {ticker: 'XOM', name: 'Exxon Mobil Corporation'},
      {ticker: 'CVX', name: 'Chevron Corporation'},
      {ticker: 'BP', name: 'BP p.l.c.'},
      {ticker: 'RDS.A', name: 'Royal Dutch Shell plc'},
      
      // Materiales
      {ticker: 'BHP', name: 'BHP Group Limited'},
      {ticker: 'RIO', name: 'Rio Tinto Group'},
      {ticker: 'DD', name: 'DuPont de Nemours Inc.'}
    ];
    
    return of(mockTickers).pipe(
      tap(tickers => console.log('Tickers loaded:', tickers.length)),
      catchError(this.handleError<{ticker: string, name: string}[]>('getAvailableTickers', []))
    );
  }

  // Cambiar contraseña
  changePassword(passwords: { current: string, new: string, confirm: string }): Observable<any> {
    // En producción: return this.http.post<any>(`${this.apiUrl}/profile/change-password`, passwords);
    
    // Mock para desarrollo
    return of({ success: true, message: 'Contraseña actualizada correctamente' }).pipe(
      tap(result => console.log('Password change result:', result)),
      catchError(this.handleError<any>('changePassword'))
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