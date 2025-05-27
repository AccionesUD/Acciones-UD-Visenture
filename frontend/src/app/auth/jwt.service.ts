import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private jwtHelper = new JwtHelperService();
  
  constructor() {}
  
  public decodeToken(token: string): any {
    try {
      return this.jwtHelper.decodeToken(token);
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }
  
  public getTokenExpirationDate(token: string): Date | null {
    try {
      return this.jwtHelper.getTokenExpirationDate(token);
    } catch (error) {
      console.error('Error al obtener la fecha de expiración del token:', error);
      return null;
    }
  }  public isTokenExpired(token: string): boolean {
    try {
      // Usamos el helper estándar para verificar la expiración
      return this.jwtHelper.isTokenExpired(token);
    } catch (error: any) {
      console.error('Error al verificar la expiración del token:', error);
      // Solo expirar si realmente hay un error al decodificar
      return error.name !== 'InvalidTokenError';
    }
  }  // Calcula el tiempo restante en segundos
  public getTokenTimeRemaining(token: string): number {
    try {
      const expirationDate = this.getTokenExpirationDate(token);
      if (!expirationDate) return 0;
      
      const now = new Date();
      const diffMs = expirationDate.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000)); // Convertir a segundos
    } catch (error: any) {
      console.error('Error al calcular tiempo restante del token:', error);
      return 0;
    }
  }
  
  // Verifica si el token está próximo a expirar según la configuración
  public isTokenNearExpiry(token: string): boolean {
    const timeRemaining = this.getTokenTimeRemaining(token);
    // Usamos la variable de entorno para determinar cuándo notificar sobre la expiración
    return timeRemaining > 0 && timeRemaining <= environment.tokenExpiryNotification;
  }
}