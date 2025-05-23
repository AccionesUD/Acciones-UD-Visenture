import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

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
  }    public isTokenExpired(token: string): boolean {
    try {
      // Manejo especial para nuestro token de desarrollo
      if (token.includes('qwerty123456')) {
        const [header, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        const exp = decodedPayload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        console.log('Token debug:', {
          exp,
          now,
          diff: exp - now,
          isExpired: now >= exp
        });
        
        return now >= exp;
      }
      
      return this.jwtHelper.isTokenExpired(token);
    } catch (error: any) {
      console.error('Error al verificar la expiración del token:', error);
      // Solo expirar si realmente hay un error al decodificar
      return error.name !== 'InvalidTokenError';
    }
  }
  // Calcula el tiempo restante en segundos
  public getTokenTimeRemaining(token: string): number {
    try {
      if (token.includes('qwerty123456')) {
        const [header, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        const exp = decodedPayload.exp;
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, exp - now);
      }
      
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
}
