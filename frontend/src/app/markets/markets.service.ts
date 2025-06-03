import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { Market } from '../models/market.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketServiceService { 
  private marketsSubject = new BehaviorSubject<Market[] | null>(null);
  public markets$ = this.marketsSubject.asObservable();

  private simulatedMarkets: Market[] = [
    { id: 'NYSE', name: 'New York Stock Exchange', country: 'Estados Unidos', currency: 'USD', status: "open" },
    { id: 'NASDAQ', name: 'NASDAQ Stock Market', country: 'Estados Unidos', currency: 'USD', status: "open" },
    { id: 'LSE', name: 'London Stock Exchange', country: 'Reino Unido', currency: 'GBP', status: "closed" },
    { id: 'TSE', name: 'Tokyo Stock Exchange', country: 'Japón', currency: 'JPY', status: "closed" },
    { id: 'EURONEXT', name: 'Euronext', country: 'Europa', currency: 'EUR', status: "open" },
    { id: 'SSE', name: 'Shanghai Stock Exchange', country: 'China', currency: 'CNY', status: "closed" },
    { id: 'BMV', name: 'Bolsa Mexicana de Valores', country: 'México', currency: 'MXN', status: "closed" }
  ];

  constructor(private http: HttpClient) { }

  getMarkets(): Observable<Market[]> {
    // return this.http.get<Market[]>(this.apiUrl).pipe(
    //   tap(markets => this.marketsSubject.next(markets)),
    //   catchError(this.handleError)
    // );
    
    // Simulación mientras no está el backend
    return of(this.simulatedMarkets).pipe(
      delay(500), // Simula latencia de red
      tap(markets => {
        this.marketsSubject.next(markets); 
        console.log('Mercados obtenidos:', markets);
      }),
      catchError(this.handleError)
    );
  }

  getMarketById(id: string): Observable<Market | undefined> {
    // return this.http.get<Market>(`${this.apiUrl}/${id}`).pipe(
    //   catchError(this.handleError)
    // );
    
    // Simulación mientras no está el backend
    const market = this.simulatedMarkets.find(m => m.id === id);
    if (!market) {
      return throwError(() => new Error(`Mercado con ID: ${id} no encontrado.`));
    }
    return of(market).pipe(delay(500));
  }

  getMarketsWithError(): Observable<Market[]> {
    return throwError(() => new Error('Error simulado: La API no responde.'));
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
          errorMessage = 'No se encontró el recurso solicitado.';
          break;
        case 403:
          errorMessage = 'No tiene permisos para acceder a este recurso.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en MarketServiceService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
