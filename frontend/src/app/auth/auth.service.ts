import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
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
  private userKey = 'user_data';
  private tokenExpirationTimer: any = null;
  private platformId = inject(PLATFORM_ID);
  
  // URL base para las peticiones de autenticación (se reemplazará con URL real cuando se integre con backend)
  private apiUrl = 'api'; 
  
  constructor(
    private router: Router,
    private jwtService: JwtService,
    private authState: AuthStateService
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
  }
  
  login(credentials: LoginCredentials): Observable<{ success: boolean, requireMfa: boolean }> {
    // Simulación de respuesta del backend mientras no existe
    if (credentials.email === 'demo@example.com' && credentials.password === '123456') {
      return of({ success: true, requireMfa: true }).pipe(
        delay(1000) // Simular retardo de red
      );
    }
    
    return throwError(() => new Error('Credenciales incorrectas'));
  }
  
  // Método para verificar el token MFA
  verifyMfa(verification: MfaVerification): Observable<AuthResponse> {
    console.log('Verificando MFA:', verification);
      // Validar formato del token (debe ser exactamente 6 caracteres alfanuméricos: números y mayúsculas)
    const tokenRegex = /^[0-9A-Z]{6}$/;
    if (!tokenRegex.test(verification.token)) {
      return throwError(() => new Error('El código debe ser de 6 caracteres (números o letras mayúsculas)'));
    }
    
    // Simulación de verificación MFA mientras no existe backend
    const submittedToken = String(verification.token);
    const validToken = '123456';
    
    console.log('Comparando tokens:', {
      submittedToken,
      validToken,
      isEqual: submittedToken === validToken,
      tokenType: typeof submittedToken,
      email: verification.email
    });
    
    if (submittedToken === validToken && verification.email === 'demo@example.com') {
      const mockUser: User = {
        id: '1',
        username: 'demo',
        email: 'demo@example.com',
        name: 'Usuario Demo',
        role: 'user'
      };      // Generamos un JWT simulado para desarrollo
      const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
      const exp = now + 259200; // Expiración: ahora + 3 días
      
      // Token simulado con formato JWT y campos reales
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6${now},"exp":${exp}}.qwerty123456`;
      const expiresIn = 259200; // 3 días en segundos
      
      return of({ user: mockUser, token: mockToken, expiresIn }).pipe(
        delay(1000),
        tap(res => {
          if (isPlatformBrowser(this.platformId)) {
            // Guardar token y usuario en localStorage solo si estamos en el navegador
            localStorage.setItem(this.tokenKey, res.token);
            localStorage.setItem(this.userKey, JSON.stringify(res.user));
          }
          this.currentUserSubject.next(res.user);
          this.authState.updateUser(res.user);
          
          // Configurar temporizador para expiración de sesión
          this.setAuthTimer(expiresIn);
        })
      );
    }
    
    return throwError(() => new Error('Código de verificación incorrecto'));
  }
  
  // Método para cerrar sesión
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    
    // Limpiar el temporizador de autenticación
    this.clearAuthTimer();
    
    // Limpiar el usuario actual
    this.currentUserSubject.next(null);
    this.authState.updateUser(null);
    
    // Redireccionar al home
    this.router.navigate(['/home']);
  }
  
  // Método para solicitar reenvío de token
  resendToken(email: string): Observable<{ success: boolean }> {
    // Simulación de reenvío de token mientras no existe backend
    if (email === 'demo@example.com') {
      return of({ success: true }).pipe(delay(1000));
    }
    
    return throwError(() => new Error('Usuario no encontrado'));
  }
  
  // Método para solicitar recuperación de contraseña
  forgotPassword(email: string): Observable<{ success: boolean, message: string }> {
    console.log('Solicitando recuperación de contraseña para:', email);
    
    // Simulación de respuesta mientras no existe backend
    if (email === 'demo@example.com') {
      return of({ 
        success: true, 
        message: 'Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.'
      }).pipe(delay(1000));
    }
    
    // return this.http.post<{ success: boolean, message: string }>(
    //   `${this.apiUrl}/auth/forgot-password`,
    //   { email }
    // );
    
    return of({ 
      success: true, 
      message: 'Si el correo electrónico existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
    }).pipe(delay(1000));
  }
  
  // Método para validar token de restablecimiento
  validatePasswordResetToken(token: string): Observable<{ valid: boolean }> {
    console.log('Validando token de restablecimiento:', token);
    
    // Simulación de validación mientras no existe backend
    // En un caso real, se enviaría el token al backend para validar
    const isValid = token === 'valid-token';
    
    // return this.http.get<{ valid: boolean }>(
    //   `${this.apiUrl}/auth/reset-password/validate/${token}`
    // );
    
    if (isValid) {
      return of({ valid: true }).pipe(delay(800));
    }
    return throwError(() => new Error('El token no es válido o ha expirado'));
  }
  
  // Método para restablecer contraseña
  resetPassword(token: string, password: string, confirmPassword: string): Observable<{ success: boolean, message: string }> {
    console.log('Restableciendo contraseña con token:', token);
    
    if (password !== confirmPassword) {
      return throwError(() => new Error('Las contraseñas no coinciden'));
    }
    
    // Simulación de respuesta mientras no existe backend
    // En un caso real, se enviaría el token y la nueva contraseña al backend
    const isValid = token === 'valid-token';
    
    // return this.http.post<{ success: boolean, message: string }>(
    //   `${this.apiUrl}/auth/reset-password`,
    //   { token, password, confirmPassword }
    // );
    
    if (isValid) {
      return of({
        success: true,
        message: 'Tu contraseña ha sido restablecida con éxito'
      }).pipe(delay(1000));
    }
    
    return throwError(() => new Error('No se pudo restablecer la contraseña. El token no es válido o ha expirado.'));
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
          this.currentUserSubject.next(user);
          this.authState.updateUser(user);
          
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
