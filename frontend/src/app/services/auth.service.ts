import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../Enviroments/enviroment';
import { JwtService } from './jwt.service';
import { AuthStateService } from './auth-state.service';
import { LoginCredentials, MfaVerification, User, AuthResponse } from '../models/auth.model';

// Interfaces para la autenticación


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
  private registerUrl = environment.apiUrl;
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
    register(userData: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{message: string}>(`${this.registerUrl}/users`, userData).pipe(
      map(response => {
        return {
          success: true,
          message: response.message || 'Registro exitoso. Por favor, inicia sesión.'
        };
      }),
      catchError(error => {
        console.error('Error en registro:', error);
        // En lugar de manejar el error aquí, lo propagamos para que el componente lo maneje
        return throwError(() => error);
      })
    );
  
  } 
  // Verifica si el usuario está autenticado
  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  // Obtiene el usuario actual
  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }  
  
  login(credentials: LoginCredentials): Observable<{ success: boolean, requireMfa: boolean }> {
    // Llamada real al backend
    return this.http.post<{ message: string, token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      map(response => {
        console.log('Login exitoso:', response);
        // El backend devuelve un mensaje y un token temporal
        return { 
          success: true, 
          requireMfa: true 
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
    
    // Llamamos directamente a completar login
    return this.http.post<{ message: string, success: boolean }>(
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
        const token = response.message;
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
    
  }

  resendToken(email: string): Observable<{ success: boolean, message: string }> {
    console.log('Solicitando reenvío de token para:', email);
    
    if (!email || !email.trim()) {
      return of({ 
        success: false, 
        message: 'Se requiere un correo electrónico válido para reenviar el código' 
      });
    }
      // Usamos el endpoint para reenviar el token
    return this.http.post<{ success: boolean, message: string }>(`${this.apiUrl}/resend-token2fma`, { email }).pipe(
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
  
  validateResetToken(token: string, email: string): Observable<{ valid: boolean, message?: string }> {
    console.log('Validando token de restablecimiento:', token, 'para email:', email);
    
    if (!token || !email) {
      return throwError(() => new Error('Se requiere token y email para la validación'));
    }
    
    return this.http.post<{ valid: boolean, message?: string }>(
      `${this.apiUrl}/validate-reset-token`,
      { token, email }
    ).pipe(
      catchError(error => {
        console.error('Error al validar token de restablecimiento:', error);
        return of({ valid: false, message: error.error?.message || 'Token inválido o expirado' });
      })
    );
  }
  
  resetPassword(token: string, password: string, confirmPassword: string, email?: string): Observable<any> {
    // Usar el email proporcionado o intentar obtenerlo del almacenamiento local
    const userEmail = email || localStorage.getItem('reset_email');
    
    console.log('Enviando solicitud de reset con email:', userEmail, 'y token:', token);
    
    if (!token || !userEmail || !password || !confirmPassword) {
      return throwError(() => new Error('Se requieren todos los campos para restablecer la contraseña'));
    }
    
    if (password !== confirmPassword) {
      return throwError(() => new Error('Las contraseñas no coinciden'));
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;
    
    if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasSpecialChar || !isLongEnough) {
      return throwError(() => new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y al menos un carácter especial.'));
    }
    
    // Enviar el formato correcto que espera el backend: newPassword en lugar de password/confirmPassword
    return this.http.post(
      `${this.apiUrl}/reset-password`,
      {
        token,
        email: userEmail,
        newPassword: password // Usar newPassword como espera el backend
      }
    ).pipe(
      tap(() => {
        // Limpiar el email de reseteo del almacenamiento local si se usó
        if (!email && localStorage.getItem('reset_email')) {
          localStorage.removeItem('reset_email');
        }
      }),
      catchError(error => {
        console.error('Error al restablecer contraseña:', error);
        
        // Manejar específicamente el error de contraseña débil
        if (error.error?.message?.includes('newPassword is not strong enough')) {
          return throwError(() => new Error('La contraseña no es lo suficientemente segura. Debe incluir mayúsculas, minúsculas, números y caracteres especiales.'));
        }
        
        return throwError(() => new Error(error.error?.message || 'Error al restablecer la contraseña'));
      })
    );
  }

  
  public loadUserFromStorage(): void {
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