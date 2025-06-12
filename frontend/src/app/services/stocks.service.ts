import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
   * Inicializa los mercados en el backend (solo para admin)
   */
  initializeMarkets(): Observable<StockInitResponse> {
    return this.http.post<StockInitResponse>(`${this.apiUrl}/inicializacion`, {}).pipe(
      tap(response => console.log('Mercados inicializados:', response)),
      catchError(error => {
        console.error('Error al inicializar mercados:', error);
        return throwError(() => new Error('Error al inicializar mercados'));
      })
    );
  }
  
  /**
   * Obtiene todos los stocks (mercados) disponibles
   */
  getStocks(): Observable<Stock[]> {
    // Si tenemos datos en caché, los devolvemos primero mientras actualizamos
    if (this.stocksCache.length > 0) {
      this.stocksSubject.next(this.stocksCache);
    }
    
    return this.http.get<Stock[]>(this.apiUrl).pipe(
      tap(stocks => {
        this.stocksCache = stocks;
        this.stocksSubject.next(stocks);
      }),
      catchError(error => {
        console.error('Error al obtener stocks (mercados):', error);
        
        // Si hay error pero tenemos caché, usamos eso
        if (this.stocksCache.length > 0) {
          return of(this.stocksCache);
        }
        
        // Si no tenemos caché, generamos datos de prueba
        return this.getFallbackStocks();
      })
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
              if (foundStock) {
                return foundStock;
              }
              throw new Error(`No se encontró el mercado con MIC ${mic}`);
            })
          );
        }
        
        return throwError(() => new Error(`Error al obtener detalles del mercado ${mic}`));
      })
    );
  }
  
  /**
   * Obtiene el estado actual del reloj de mercado
   */
  getMarketClock(): Observable<MarketClock> {
    return this.http.get<MarketClock>(`${this.apiUrl}/clock`).pipe(
      catchError(error => {
        console.error('Error al obtener reloj del mercado:', error);
        
        // Valores por defecto si falla la llamada
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 30, 0, 0);
        
        const fallbackClock: MarketClock = {
          timestamp: now.toISOString(),
          is_open: false,
          next_open: tomorrow.toISOString(),
          next_close: tomorrow.toISOString()
        };
        
        return of(fallbackClock);
      })
    );
  }
  
  /**
   * Datos de respaldo si el backend no está disponible
   */
  private getFallbackStocks(): Observable<Stock[]> {
    console.warn('Usando datos de respaldo para stocks (mercados)');
    
    const fallbackStocks: Stock[] = [
      {
        mic: 'XNYS',
        name_market: 'New York Stock Exchange',
        country_region: 'Estados Unidos',
        opening_time: '09:30',
        closing_time: '16:00',
        days_operation: 'Lunes a Viernes',
        status: 'active',
        is_open: false
      },
      {
        mic: 'XMAD',
        name_market: 'Bolsa de Madrid',
        country_region: 'España',
        opening_time: '09:00',
        closing_time: '17:30',
        days_operation: 'Lunes a Viernes',
        status: 'active',
        is_open: false
      },
      {
        mic: 'XLON',
        name_market: 'London Stock Exchange',
        country_region: 'Reino Unido',
        opening_time: '08:00',
        closing_time: '16:30',
        days_operation: 'Lunes a Viernes',
        status: 'active',
        is_open: false
      }
    ];
    
    this.stocksCache = fallbackStocks;
    this.stocksSubject.next(fallbackStocks);
    return of(fallbackStocks);
  }
}
