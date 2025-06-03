import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, tap, catchError, map } from 'rxjs/operators';
import { Market } from '../models/market.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketServiceService {
  private apiUrl = `${environment.apiUrl}/market`;
  private marketsSubject = new BehaviorSubject<Market[] | null>(null);
  public markets$ = this.marketsSubject.asObservable();

  // Cache de mercados para optimizar las solicitudes
  private marketsCache: Market[] = [];

  constructor(private http: HttpClient) { }

  getMarkets(): Observable<Market[]> {
    // Si tenemos datos en caché, los usamos primero mientras actualizamos
    if (this.marketsCache.length > 0) {
      this.marketsSubject.next(this.marketsCache);
    }
    
    return this.http.get<Market[]>(this.apiUrl).pipe(
      map(markets => markets.map(market => this.adaptMarketFromAPI(market))),      tap(markets => {
        this.marketsCache = markets;
        this.marketsSubject.next(markets);
        console.log('Mercados obtenidos:', markets);
      }),
      catchError(error => {
        console.error('Error al obtener mercados:', error);
        return this.handleError(error);
      })
    );
  }

  getMarketById(id: string): Observable<Market | undefined> {
    // Primero intentamos encontrarlo en caché
    if (this.marketsCache.length > 0) {
      const cachedMarket = this.marketsCache.find(m => 
        m.symbol === id || m.id === id
      );
      
      if (cachedMarket) {
        return of(cachedMarket);
      }
    }
    
    // Si no está en caché, obtenemos todos los mercados y filtramos
    return this.getMarkets().pipe(
      map(markets => markets.find(m => m.symbol === id || m.id === id)),
      catchError(error => {
        console.error(`Error al buscar mercado ${id}:`, error);
        return throwError(() => new Error(`Mercado con ID: ${id} no encontrado.`));
      })
    );
  }

  getMarketsWithError(): Observable<Market[]> {
    return throwError(() => new Error('Error simulado: La API no responde.'));
  } 

  private adaptMarketFromAPI(apiMarket: Market): Market {
    return {
      ...apiMarket,
      id: apiMarket.symbol, // Para mantener compatibilidad con código existente
      status: this.translateStatus(apiMarket.status, apiMarket.isActive),
      description: `${apiMarket.name} es un activo que cotiza con el símbolo ${apiMarket.symbol} en la divisa ${apiMarket.currency}.`
      // No se agregan campos ficticios como iconUrl, openingTime, etc.
    };
  }
    
  private translateStatus(status: string, isActive: boolean): 'open' | 'closed' {
    // El backend puede devolver diferentes valores para el estado
    if ((status === 'active' || status === 'open') && isActive) {
      // Verificamos si estamos en horario de mercado (9:30 AM - 4:00 PM EST)
      const now = new Date();
      const day = now.getDay(); // 0 es domingo, 6 es sábado
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Si es fin de semana, mercado cerrado
      if (day === 0 || day === 6) {
        return 'closed';
      }
      
      // Convertimos la hora actual a formato decimal para comparar fácilmente
      const currentTimeDecimal = hour + (minute / 60);
      
      // Horario típico de NYSE: 9:30 AM - 4:00 PM (EST)
      if (currentTimeDecimal >= 9.5 && currentTimeDecimal <= 16) {
        return 'open';
      }
      return 'closed';
    }
    return 'closed';
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error del servidor al procesar la solicitud.';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Error devuelto por el backend
      switch (error.status) {
        case 404:
          errorMessage = 'No se encontró el recurso solicitado. Verifique la URL del servicio.';
          break;
        case 403:
          errorMessage = 'No tiene permisos para acceder a este recurso. Verifique su autenticación.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, contacte al equipo de soporte.';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión o que el servidor esté en ejecución.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message || (error.error && error.error.message) || 'Error desconocido'}`;
      }
    }
    
    console.error('Error en MarketServiceService:', error);
    console.log('URL que causó el error:', error.url || 'No disponible');
    
    return throwError(() => new Error(errorMessage));
  }

  getMarketDetails(symbol: string): Observable<any> {

    const url = `${this.apiUrl}/${symbol}`;
    
    return this.http.get(url).pipe(
      map(data => this.adaptMarketDetailsFromAPI(data, symbol)),
      catchError(error => {
        // Si no existe el endpoint específico o hay un error, ofrecemos datos limitados
        console.error(`Error al obtener detalles del mercado ${symbol}:`, error);
        
        // Intentamos usar la información en caché
        const cachedMarket = this.marketsCache.find(m => 
          m.symbol === symbol || m.id === symbol
        );
        
        if (cachedMarket) {
          // Enriquecemos los datos del mercado en caché con información simulada
          return of(this.generateFallbackMarketDetails(cachedMarket));
        }
        
        return throwError(() => new Error(`No se pudieron obtener detalles del mercado ${symbol}`));
      })
    );
  }
    
  private adaptMarketDetailsFromAPI(apiData: any, symbol: string): any {
    // Solo pasamos los datos tal como vienen del backend, sin agregar campos adicionales
    return {
      ...apiData,
      id: symbol // Mantenemos el id por compatibilidad
      // No agregamos campos adicionales que no existan en el backend
    };
  }

  private generateFallbackMarketDetails(market: Market): any {
    return {
      ...market,
      // Solo añadimos la descripción como dato mínimo necesario
      description: market.description || `${market.name} es un activo que cotiza con el símbolo ${market.symbol} en la divisa ${market.currency}.`
    };
  }
}
