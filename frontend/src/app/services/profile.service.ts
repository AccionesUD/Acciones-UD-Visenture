import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { UserPreferences } from '../models/notification.model';
import { User, UpdateProfileDto, ChangePasswordDto, ProfileUpdateResponse } from '../models/user.model';
import { environmentExample } from '../../environments/environmentexample';


@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environmentExample.apiUrl;
  
  // BehaviorSubject para mantener el perfil del usuario actual
  private userProfileSubject = new BehaviorSubject<User | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

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

  /**
   * Obtiene el perfil completo del usuario
   */
  getUserProfile(): Observable<User> {
    // Si ya tenemos el perfil en caché, lo retornamos
    if (this.userProfileSubject.value) {
      return of(this.userProfileSubject.value);
    }
    
    // En producción: return this.http.get<User>(`${this.apiUrl}/profile`).pipe(...
    
    // Mock para desarrollo
    const mockProfile: User = {
      id: 1,
      identity_document: '1234567890',
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan.perez@example.com',
      phone_number: '+57 300 123 4567',
      birthdate: new Date('1990-01-15'),
      
    };
    
    return of(mockProfile).pipe(
      tap(profile => {
        console.log('User profile loaded:', profile);
        this.userProfileSubject.next(profile);
      }),
      catchError(this.handleError<User>('getUserProfile'))
    );
  }
  
  /**
   * Obtener información básica del perfil (para compatibilidad)
   */
  getUserProfileInfo(): Observable<any> {
    return this.getUserProfile().pipe(
      map(profile => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone_number,
        created_at: '2023-01-15',
        subscription_type: 'Premium',
        broker: 'XYZ Investments'
      }))
    );
  }
  
  /**
   * Actualiza los datos del perfil del usuario
   */
  updateProfile(profileData: UpdateProfileDto): Observable<ProfileUpdateResponse> {
    // En producción: return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/profile`, profileData).pipe(...
    
    // Mock para desarrollo
    return this.getUserProfile().pipe(
      map(currentProfile => {
        const updatedProfile = {
          ...currentProfile,
          ...profileData
        };
        
        this.userProfileSubject.next(updatedProfile);
        
        return {
          success: true,
          message: 'Perfil actualizado correctamente',
          data: updatedProfile
        };
      }),
      catchError(this.handleError<ProfileUpdateResponse>('updateProfile', {
        success: false,
        message: 'Error al actualizar el perfil'
      }))
    );
  }
  
  /**
   * Para compatibilidad con código existente
   */
  updateProfileInfo(profileData: any): Observable<any> {
    return this.updateProfile({
      email: profileData.email,
      phone_number: profileData.phone
    }).pipe(
      map(response => ({
        ...response.data,
        updated_at: new Date().toISOString()
      }))
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

  /**
   * Cambiar contraseña del usuario
   */
  /**
   * Cambiar contraseña del usuario
   */
  changePassword(passwordData: { currentPassword: string, newPassword: string }): Observable<ProfileUpdateResponse> {
    // Llamada real al backend para cambiar la contraseña
    return this.http.patch<ProfileUpdateResponse>(`${this.apiUrl}/auth/perfil/password`, passwordData).pipe(
      catchError(this.handleError<ProfileUpdateResponse>('changePassword', {
        success: false,
        message: 'Error al cambiar la contraseña'
      }))
    );
  }
  
  /**
   * Compatibilidad con el formato anterior
   */
  changePasswordLegacy(passwords: { current: string, new: string, confirm: string }): Observable<any> {
    return this.changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.new
    });
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