import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Market } from '../models/market.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private apiUrl = `${environment.apiUrl}/markets`;

  constructor(private http: HttpClient) { }

  getMarkets(): Observable<Market[]> {
    return this.http.get<Market[]>(this.apiUrl).pipe(
      tap(markets => console.log('Mercados obtenidos:', markets)),
      catchError(this.handleError('getMarkets', []))
    );
  }

  getMarketById(id: string): Observable<Market> {
    return this.http.get<Market>(`${this.apiUrl}/${id}`).pipe(
      tap(market => console.log(`Mercado obtenido: ${market.name}`)),
      catchError(this.handleError<Market>(`getMarketById id=${id}`))
    );
  }

  getStocksByMarket(marketId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${marketId}/stocks`).pipe(
      tap(stocks => console.log(`Acciones obtenidas para el mercado ${marketId}:`, stocks)),
      catchError(this.handleError(`getStocksByMarket marketId=${marketId}`, []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      // Log del error
      console.error(`${operation} falló: ${error.message}`);
      
      // Preparar mensaje de error para el usuario
      let errorMessage = 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
      
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar al servidor. Comprueba tu conexión a internet.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado. Verifica la ruta de acceso.';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para acceder a este recurso.';
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Vuelve a iniciar sesión.';
      }

      // Devolver un observable con un valor de error centinela
      return throwError(() => new Error(errorMessage));
    };
  }

  // Método para obtener datos de prueba mientras no haya un backend
  getMockMarkets(): Observable<Market[]> {
    const mockMarkets: Market[] = [
      {
        id: '1',
        name: 'NYSE',
        symbol: 'NYSE',
        isActive: true,
        country: 'Estados Unidos',
        currency: 'USD',
        status: 'open',
        openingTime: '9:30 AM',
        closingTime: '4:00 PM',
        timezone: 'EST',
        description: 'La Bolsa de Nueva York, el mercado bursátil más grande del mundo por capitalización.',
        iconUrl: 'assets/images/markets/usa.png'
      },
      {
        id: '2',
        name: 'NASDAQ',
        symbol: 'NASDAQ',
        isActive: true,
        country: 'Estados Unidos',
        currency: 'USD',
        status: 'open',
        openingTime: '9:30 AM',
        closingTime: '4:00 PM',
        timezone: 'EST',
        description: 'Mercado electrónico con enfoque en empresas de tecnología e innovación.',
        iconUrl: 'assets/images/markets/usa.png'
      },
      {
        id: '3',
        name: 'LSE',
        symbol: 'LSE',
        isActive: false,
        country: 'Reino Unido',
        currency: 'GBP',
        status: 'closed',
        openingTime: '8:00 AM',
        closingTime: '4:30 PM',
        timezone: 'GMT',
        description: 'La Bolsa de Londres, una de las bolsas de valores más antiguas del mundo.',
        iconUrl: 'assets/images/markets/uk.png'
      },
      {
        id: '4',
        name: 'TSE',
        symbol: 'TSE',
        isActive: false,
        country: 'Japón',
        currency: 'JPY',
        status: 'closed',
        openingTime: '9:00 AM',
        closingTime: '3:00 PM',
        timezone: 'JST',
        description: 'La Bolsa de Tokio, la principal bolsa de valores de Japón.',
        iconUrl: 'assets/images/markets/japan.png'
      },
      {
        id: '5',
        name: 'SSE',
        symbol: 'SSE',
        isActive: false,
        country: 'China',
        currency: 'CNY',
        status: 'closed',
        openingTime: '9:30 AM',
        closingTime: '3:00 PM',
        timezone: 'CST',
        description: 'La Bolsa de Shanghái, uno de los principales mercados de valores de China.',
        iconUrl: 'assets/images/markets/china.png'
      }
    ];

    // Simulamos un delay para imitar una llamada a API real
    return of(mockMarkets).pipe(delay(800));
  }
}
