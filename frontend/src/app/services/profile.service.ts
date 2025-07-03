import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { UserPreferences } from '../models/notification.model';
import { User, UpdateProfileDto, ChangePasswordDto, ProfileUpdateResponse } from '../models/user.model';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model'; 

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;
  
  // BehaviorSubject para mantener el perfil del usuario actual
  private userProfileSubject = new BehaviorSubject<User | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) { }
  // Obtener las preferencias del usuario
  getUserPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.apiUrl}/profile/preferences`).pipe(
      tap(prefs => console.log('User preferences loaded:', prefs)),
      catchError(this.handleError<UserPreferences>('getUserPreferences'))
    );
  }
  // Guardar preferencias del usuario
  saveUserPreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(`${this.apiUrl}/profile/preferences`, preferences).pipe(
      tap(updatedPrefs => console.log('User preferences updated:', updatedPrefs)),
      catchError(this.handleError<UserPreferences>('saveUserPreferences'))
    );
  }

  /**
   * Obtiene el perfil completo del usuario
   */
  getUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/perfilCompleto`).pipe(
      map((data: any) => {
        // Mapear la respuesta del backend a la estructura User esperada
        return {
          id: data.id || null,
          identity_document: data.identity_document || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone || '', // Mapeo correcto
          address: data.address || '',    // Mapeo correcto
          birthdate: data.birthdate || null
        } as User;
      }),
      tap((profile: User) => {
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
    return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/profile`, profileData).pipe(
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
    return this.http.get<{ticker: string, name: string}[]>(`${this.apiUrl}/market/tickers`).pipe(
      tap(tickers => console.log('Tickers loaded:', tickers.length)),
      catchError(this.handleError<{ticker: string, name: string}[]>('getAvailableTickers', []))
    );
  }

  getOrdersHistory(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/accounts/orders`).pipe(
      tap(orders => {
        console.log('Respuesta original del backend (historial de órdenes):', JSON.stringify(orders, null, 2));
      }),
      catchError(this.handleError<Order[]>('getOrdersHistory', []))
    );
  }

 cancelOrderById(orderId: number): Observable<any> {
   return this.http.delete(`${this.apiUrl}/orders/${String(orderId)}`).pipe(
     catchError(this.handleError<any>('cancelOrderById'))
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
