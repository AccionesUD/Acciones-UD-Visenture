import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';
import { AuthStateService } from './auth-state.service';

// Interfaces para la autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MfaVerification {
  token: string;
  email: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number; // Tiempo de expiración en segundos
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'user_data';  private tokenExpirationTimer: any = null;
  private platformId = inject(PLATFORM_ID);
  
  // URL base para las peticiones de autenticación desde las variables de entorno
  private apiUrl = environment.authApiUrl;
    constructor(
    private router: Router,
    private jwtService: JwtService,
    private authState: AuthStateService,
    private http: HttpClient
  ) {
    // Recuperar usuario de localStorage al iniciar
    this.loadUserFromStorage();
  }
  
  // Verifica si el usuario está autenticado
  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  // Obtiene el usuario actual
  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }  login(credentials: LoginCredentials): Observable<{ success: boolean, requireMfa: boolean }> {
    // Llamada real al backend
    return this.http.post<{ message: string, token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      map(response => {
        console.log('Login exitoso:', response);
        // El backend devuelve un mensaje y un token temporal
        return { 
          success: true, 
          requireMfa: true // Siempre requerimos MFA en este flujo
        };
      }),
      catchError(error => {
        console.error('Error en login:', error);
        // Extraer mensaje de error del backend o usar uno genérico
        const errorMsg = error.error?.message || 
                        error.error?.error || 
                        'No se pudo iniciar sesión. Verifica tus credenciales.';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
    // Método para verificar el token MFA
  verifyMfa(verification: MfaVerification): Observable<AuthResponse> {
    console.log('Verificando MFA:', verification);
    
    // Validar formato del token (debe ser exactamente 6 caracteres alfanuméricos: números y mayúsculas)
    const tokenRegex = /^[0-9A-Z]{6}$/;
    if (!tokenRegex.test(verification.token)) {
      return throwError(() => new Error('El código debe ser de 6 caracteres (números o letras mayúsculas)'));
    }
    
    // Asegurarnos de que el token esté en mayúsculas
    const normalizedVerification = {
      ...verification,
      token: verification.token.toUpperCase()
    };
      // Llamamos directamente a completar login, saltándonos la validación previa
    // que consumía el token antes de tiempo
    return this.http.post<{ accessToken: string }>(
      `${this.apiUrl}/complete-login`, 
      normalizedVerification
    ).pipe(
      catchError(error => {
        console.error('Error al completar login:', error);
        const errorMsg = error.error?.message || 'Error al completar el inicio de sesión';
        console.error('Mensaje de error:', errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      // Procesamos el token JWT recibido
      switchMap(response => {
        console.log('Token JWT recibido:', response);
        const token = response.accessToken;
        // Decodificamos el token para obtener la información del usuario
        const decodedToken = this.jwtService.decodeToken(token);
        
        console.log('Token decodificado:', decodedToken);
        
        if (!decodedToken) {
          return throwError(() => new Error('Token inválido recibido del servidor'));
        }
        
        // Creamos el objeto usuario a partir del token decodificado
        const user: User = {
          id: String(decodedToken.sub),
          email: decodedToken.email,
          username: decodedToken.email.split('@')[0], // Temporal: generamos username desde email
          name: decodedToken.name || decodedToken.email.split('@')[0], // Si no hay nombre, usamos parte del email
          role: decodedToken.role || 'user' // Por defecto, asignamos rol 'user'
        };
        
        // Calculamos tiempo de expiración desde el token
        const expiresIn = this.jwtService.getTokenTimeRemaining(token);
        
        // Creamos la respuesta de autenticación
        const authResponse: AuthResponse = {
          user,
          token,
          expiresIn
        };
        
        // Guardamos los datos en localStorage y actualizamos estado
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }
        
        this.currentUserSubject.next(user);
        this.authState.updateUser(user);
        
        // Configurar temporizador para expiración de sesión
        this.setAuthTimer(expiresIn);
        
        return of(authResponse);
      }),
      catchError(error => {
        console.error('Error verificando token:', error);
        return throwError(() => new Error(error.error?.message || 'Error al verificar el token'));
      })
    );
  }
    // Método para cerrar sesión
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      // Eliminar cualquier otra información de sesión almacenada
      sessionStorage.clear();
    }
    
    // Limpiar el temporizador de autenticación
    this.clearAuthTimer();
    
    // Limpiar el usuario actual
    this.currentUserSubject.next(null);
    this.authState.updateUser(null);
      // Redireccionar al home
    this.router.navigate(['/home']);
    
    // Si hay un endpoint de logout en el backend, podríamos llamarlo aquí:
    // this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
  }
    // Método para solicitar reenvío de token
  resendToken(email: string): Observable<{ success: boolean, message: string }> {
    console.log('Solicitando reenvío de token para:', email);
    
    if (!email || !email.trim()) {
      return of({ 
        success: false, 
        message: 'Se requiere un correo electrónico válido para reenviar el código' 
      });
    }
      // Usamos el endpoint para reenviar el token
    return this.http.post<{ success: boolean, message: string }>(`${this.apiUrl}/resend-token`, { email }).pipe(
      map(response => {
        console.log('Token reenviado:', response);
        return { 
          success: response.success !== false, 
          message: response.message 
        };
      }),
      catchError(error => {
        console.error('Error al reenviar token:', error);
        const errorMessage = error.error?.message || 'No se pudo reenviar el código';
        return of({ success: false, message: errorMessage });
      })
    );
  }
  // Método para solicitar recuperación de contraseña
  forgotPassword(email: string): Observable<{ success: boolean, message: string }> {
    console.log('Solicitando recuperación de contraseña para:', email);
    
    // Llamada real al endpoint de recuperación de contraseña
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      map(response => {
        return { 
          success: true, 
          message: response.message || 'Si el correo electrónico existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
        };
      }),
      catchError(error => {
        console.error('Error en recuperación de contraseña:', error);
        // Para no dar pistas de qué emails están registrados, podemos devolver un mensaje genérico
        return of({ 
          success: true, 
          message: 'Si el correo electrónico existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
        });
      })
    );
  }
  // Método para restablecer contraseña
  resetPassword(token: string, password: string, confirmPassword: string): Observable<{ success: boolean, message: string }> {
    if (password !== confirmPassword) {
      return throwError(() => new Error('Las contraseñas no coinciden'));
    }
    
    const email = localStorage.getItem('reset_email');
    
    console.log('Enviando solicitud de reset con email:', email, 'y token:', token);

    // Verificar que tenemos los datos necesarios
    if (!token || !email) {
      return throwError(() => new Error('Faltan datos necesarios para restablecer la contraseña'));
    }

    // El DTO del backend espera: token, email y newPassword
    return this.http.post<{ success: boolean, message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, email, newPassword: password }
    ).pipe(
      tap(response => {
        if (response.success) {
          localStorage.removeItem('reset_email');
        }
      }),
      catchError(error => {
        console.error('Error al restablecer contraseña:', error);
        throw error;
      })
    );
  }
    // Cargar usuario desde localStorage al iniciar la aplicación
  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      const userData = localStorage.getItem(this.userKey);
      
      if (token && userData) {
        try {
          // Verificar si el token ha expirado
          if (this.jwtService.isTokenExpired(token)) {
            console.log('Token expirado, cerrando sesión');
            this.logout();
            return;
          }
          
          const user: User = JSON.parse(userData);
          
          // Actualizar ambos servicios para mantener consistencia
          this.currentUserSubject.next(user);
          this.authState.updateUser(user);
          
          console.log('Sesión cargada desde localStorage:', user);
          
          // Configurar timer para expiración automática
          const timeRemaining = this.jwtService.getTokenTimeRemaining(token);
          if (timeRemaining > 0) {
            this.setAuthTimer(timeRemaining);
          } else {
            this.logout();
          }
        } catch (e) {
          console.error('Error parsing user data from localStorage', e);
          this.logout(); // Si hay error, limpiar localStorage
        }
      } else {
        // Asegurarse de que ambos servicios muestren que no hay usuario autenticado
        this.currentUserSubject.next(null);
        this.authState.updateUser(null);
      }
    }
  }
  
  // Configurar temporizador para expiración de la sesión
  private setAuthTimer(duration: number): void {
    console.log(`Configurando temporizador de autenticación: ${duration} segundos`);
    
    // Limpiar temporizador existente si hay alguno
    this.clearAuthTimer();
    
    // Configurar nuevo temporizador
    this.tokenExpirationTimer = setTimeout(() => {
      console.log('Temporizador de autenticación expirado, cerrando sesión');
      this.logout();
    }, duration * 1000); // Convertir segundos a milisegundos
  }
  
  // Limpiar temporizador de autenticación
  private clearAuthTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }
}