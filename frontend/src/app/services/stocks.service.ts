import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Stock, StockInitResponse, MarketClock } from '../models/stock.model';

/**
 * Servicio unificado para gestionar stocks (mercados)
 * Esta clase sustituye a los servicios anteriores relacionados con mercados
 */
@Injectable({
  providedIn: 'root'
})
export class StocksService {
  private apiUrl = `${environment.apiUrl}/stocks`;
  private stocksSubject = new BehaviorSubject<Stock[] | null>(null);
  public stocks$ = this.stocksSubject.asObservable();
  
  // Cache de stocks para optimizar las solicitudes
  private stocksCache: Stock[] = [];
  
  constructor(private http: HttpClient) {
    // Intentamos cargar los stocks al iniciar el servicio
    this.getStocks().subscribe();
  }
  
  /**
   * Inicializa los mercados en el backend (obligatorio antes de usar los mercados)
   */
  initializeMarkets(): Observable<StockInitResponse> {
    return this.http.post<StockInitResponse>(`${this.apiUrl}/inicializacion`, {}).pipe(
      tap(response => {
        console.log('Mercados inicializados:', response);
        // Después de inicializar, actualizamos la lista de mercados
        this.getStocksFromBackend().subscribe();
      }),
      catchError(error => {
        console.error('Error al inicializar mercados:', error);
        return throwError(() => new Error('Error al inicializar mercados'));
      })
    );
  }
  
  /**
   * Obtiene todos los stocks (mercados) desde el backend sin verificar inicialización
   */
  private getStocksFromBackend(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.apiUrl).pipe(
      tap(stocks => {
        console.log(`Obtenidos ${stocks.length} mercados`);
        this.stocksCache = stocks;
        this.stocksSubject.next(stocks);
      }),
      catchError(error => {
        console.error('Error al obtener mercados:', error);
        if (this.stocksCache.length > 0) {
          return of(this.stocksCache); // Devolvemos la caché si hay error
        }
        return throwError(() => new Error('Error al obtener mercados'));
      })
    );
  }
  
  /**
   * Obtiene todos los stocks (mercados) disponibles
   * Si no hay datos en caché, primero verifica que los mercados estén inicializados
   */
  getStocks(): Observable<Stock[]> {
    // Si tenemos datos en caché, los devolvemos primero mientras actualizamos en segundo plano
    if (this.stocksCache.length > 0) {
      this.stocksSubject.next(this.stocksCache);
      // Actualizamos en segundo plano
      this.getStocksFromBackend().subscribe();
      return of(this.stocksCache);
    }
    
    // Si no hay datos en caché, primero inicializamos y luego obtenemos los stocks
    return this.initializeMarkets().pipe(
      switchMap(() => this.getStocksFromBackend())
    );
  }
  
  /**
   * Obtiene un stock (mercado) específico por su ID (MIC)
   */
  getStockDetails(mic: string): Observable<Stock> {
    // Primero, intentamos encontrarlo en la caché
    const cachedStock = this.stocksCache.find(stock => stock.mic === mic);
    if (cachedStock) {
      return of(cachedStock);
    }
    
    return this.http.get<Stock>(`${this.apiUrl}/${mic}`).pipe(
      catchError(error => {
        console.error(`Error al obtener detalles del stock (mercado) ${mic}:`, error);
        
        // Si el error es 404, intentamos obtener todos los stocks para actualizar la caché
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return this.getStocks().pipe(
            map(stocks => {
              const foundStock = stocks.find(s => s.mic === mic);
              if (!foundStock) {
                throw new Error(`No se encontró el mercado con MIC: ${mic}`);
              }
              return foundStock;
            })
          );
        }
        
        return throwError(() => new Error(`Error al obtener detalles del mercado ${mic}`));
      })
    );
  }
  
  /**
   * Obtiene el estado actual del reloj del mercado
   */
  getMarketClock(): Observable<MarketClock> {
    return this.http.get<MarketClock>(`${this.apiUrl}/clock`).pipe(
      catchError(error => {
        console.error('Error al obtener el reloj del mercado:', error);
        return throwError(() => new Error('Error al obtener el estado del mercado'));
      })
    );
  }
  
  /**
   * Datos de prueba en caso de error al obtener stocks
   */
  private getFallbackStocks(): Observable<Stock[]> {
    console.log('Usando datos de fallback para stocks');
    
    const fallbackStocks: Stock[] = [
      {
        mic: 'XNYS',
        name_market: 'New York Stock Exchange',
        country_region: 'Estados Unidos',
        opening_time: '09:30',
        closing_time: '16:00',
        days_operation: 'Lunes a Viernes',
        logo: 'https://example.com/nyse-logo.png',
        status: 'active',
        is_open: this.isMarketOpen(9, 30, 16, 0)
      },
      {
        mic: 'XNAS',
        name_market: 'NASDAQ',
        country_region: 'Estados Unidos',
        opening_time: '09:30',
        closing_time: '16:00',
        days_operation: 'Lunes a Viernes',
        logo: 'https://example.com/nasdaq-logo.png',
        status: 'active',
        is_open: this.isMarketOpen(9, 30, 16, 0)
      }
    ];
    
    this.stocksCache = fallbackStocks;
    this.stocksSubject.next(fallbackStocks);
    
    return of(fallbackStocks);
  }
  
  /**
   * Calcula si un mercado está abierto en este momento
   */
  private isMarketOpen(openHour: number, openMinute: number, closeHour: number, closeMinute: number): boolean {
    const now = new Date();
    const day = now.getDay();
    
    // Verificar si es fin de semana (0 = Domingo, 6 = Sábado)
    if (day === 0 || day === 6) {
      return false;
    }
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
  }
}
