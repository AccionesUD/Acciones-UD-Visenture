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
  
  // Flag para saber si ya se han inicializado los mercados
  private marketsInitialized = false;
  
  constructor(private http: HttpClient) { 
    // Ahora intentaremos cargar los stocks al iniciar el servicio
    // Si no hay mercados, se inicializarán automáticamente
    this.loadAndInitializeIfNeeded();
  }
  
  /**
   * Método principal para cargar mercados y, si es necesario, inicializarlos
   */
  private loadAndInitializeIfNeeded(): void {
    this.getStocksFromBackend().pipe(
      switchMap(stocks => {
        if (stocks.length === 0) {
          console.log('No hay mercados disponibles, inicializando automáticamente...');
          return this.initializeMarkets();
        }
        return of({ success: true, message: 'Mercados ya existentes', count: stocks.length });
      }),
      catchError(error => {
        console.error('Error al cargar/inicializar mercados:', error);
        return of({ success: false, message: 'Error al cargar/inicializar mercados', count: 0 });
      })
    ).subscribe(result => {
      console.log('Resultado de carga/inicialización de mercados:', result);
    });
  }
  
  /**
   * Inicializa los mercados en el backend (ahora público por compatibilidad, pero idealmente no se llamaría directamente)
   */
  initializeMarkets(): Observable<StockInitResponse> {
    return this.http.post<StockInitResponse>(`${this.apiUrl}/inicializacion`, {}).pipe(
      tap(response => {
        console.log('Mercados inicializados:', response);
        this.marketsInitialized = true;
        
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
        this.marketsInitialized = stocks.length > 0;  // Marcar inicializado si hay datos
        this.stocksSubject.next(stocks);
      }),
      catchError(error => {
        console.error('Error al obtener mercados:', error);
        if (this.stocksCache.length > 0) {
          return of(this.stocksCache); // Devolvemos la caché si hay error
        }
        return of([]); // Devolvemos array vacío para manejar el flujo de inicialización
      })
    );
  }
  
  /**
   * Obtiene todos los stocks (mercados) disponibles
   * Ahora intenta inicializar automáticamente si no hay datos
   */
  getStocks(): Observable<Stock[]> {
    // Si tenemos datos en caché, los devolvemos primero
    if (this.stocksCache.length > 0) {
      this.marketsInitialized = true;  // Ya están inicializados porque hay datos
      this.stocksSubject.next(this.stocksCache);
      return of(this.stocksCache);
    }
    
    // Si no hay caché, intentamos cargar y, si es necesario, inicializar
    return this.getStocksFromBackend().pipe(
      switchMap(stocks => {
        if (stocks.length === 0) {
          console.log('No hay mercados disponibles en getStocks, intentando inicializar...');
          return this.initializeMarkets().pipe(
            switchMap(() => this.getStocksFromBackend())
          );
        }
        return of(stocks);
      }),
      catchError(error => {
        console.error('Error en getStocks:', error);
        return this.getFallbackStocks();
      })
    );
  }
  
  /**
   * Verifica si los mercados ya fueron inicializados
   */
  areMarketsInitialized(): boolean {
    return this.marketsInitialized;
  }
    /**
   * Obtiene un stock (mercado) específico por su ID (MIC)
   * Si los mercados no están inicializados, intenta inicializarlos automáticamente
   */
  getStockDetails(mic: string): Observable<Stock> {
    console.log(`[StocksService] Solicitando detalles del mercado con MIC: ${mic}`);
    
    // Primero, intentamos encontrarlo en la caché
    const cachedStock = this.stocksCache.find(stock => stock.mic === mic);
    if (cachedStock) {
      console.log(`[StocksService] Mercado ${mic} encontrado en caché:`, cachedStock);
      return of(cachedStock);
    }
    
    // Si no está en caché, verificamos si se deben inicializar los mercados
    if (this.stocksCache.length === 0 && !this.marketsInitialized) {
      console.log(`[StocksService] No hay mercados en caché. Intentando inicializar...`);
      
      // Intentar inicializar mercados y luego buscar el específico
      return this.initializeMarkets().pipe(
        switchMap(() => {
          console.log(`[StocksService] Mercados inicializados. Buscando mercado ${mic}...`);
          return this.getStocksFromBackend().pipe(
            map(stocks => {
              console.log(`[StocksService] Obtenidos ${stocks.length} mercados. Buscando ${mic}...`);
              const foundStock = stocks.find(s => s.mic === mic);
              if (!foundStock) {
                console.error(`[StocksService] No se encontró el mercado ${mic} después de inicializar`);
                throw new Error(`No se encontró el mercado con MIC: ${mic}`);
              }
              return foundStock;
            })
          );
        }),
        catchError(error => {
          console.error(`[StocksService] Error al inicializar mercados para obtener ${mic}:`, error);
          return throwError(() => new Error(`No se pudo inicializar los mercados: ${error.message}`));
        })
      );
    }
    
    // Intento normal de obtener el mercado directamente desde la API
    return this.http.get<Stock>(`${this.apiUrl}/${mic}`).pipe(
      tap(stock => console.log(`[StocksService] Mercado ${mic} obtenido directamente de la API:`, stock)),
      catchError(error => {
        console.error(`[StocksService] Error al obtener detalles del stock (mercado) ${mic}:`, error);
        
        // Si el error es 404, intentamos obtener todos los stocks para actualizar la caché
        if (error instanceof HttpErrorResponse && error.status === 404) {
          console.log(`[StocksService] Mercado ${mic} no encontrado directamente. Intentando a través de getStocks()`);
          
          return this.getStocks().pipe(
            map(stocks => {
              const foundStock = stocks.find(s => s.mic === mic);
              if (!foundStock) {
                console.error(`[StocksService] Mercado ${mic} no encontrado en la lista completa de mercados`);
                throw new Error(`No se encontró el mercado con MIC: ${mic}`);
              }
              console.log(`[StocksService] Mercado ${mic} encontrado en la lista completa:`, foundStock);
              return foundStock;
            })
          );
        }
        
        return throwError(() => new Error(`Error al obtener detalles del mercado ${mic}: ${error.message}`));
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
  
  /**
   * Busca stocks/acciones por nombre o símbolo
   * @param query Texto a buscar
   * @returns Observable con los resultados de la búsqueda
   */
  searchStocks(query: string): Observable<any[]> {
    // En producción: return this.http.get<any[]>(`${this.apiUrl}/search`, { params: { query } });
    
    // Para desarrollo, usar datos en caché o simular búsqueda
    if (this.stocksCache && this.stocksCache.length > 0) {
      // Convertimos a any[] para manejar las propiedades dinámicas
      const results = (this.stocksCache as any[]).filter(stock => 
        (stock.symbol && stock.symbol.toLowerCase().includes(query.toLowerCase())) || 
        (stock.name && stock.name.toLowerCase().includes(query.toLowerCase()))
      );
      return of(results.slice(0, 10));
    }
    
    // Si no hay cache, hacer una petición y simular resultados
    // Datos de ejemplo para desarrollo
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', current_price: 175.34 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', current_price: 340.67 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', current_price: 130.45 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', current_price: 178.23 },
      { symbol: 'META', name: 'Meta Platforms Inc.', current_price: 481.09 },
      { symbol: 'TSLA', name: 'Tesla Inc.', current_price: 177.56 },
      { symbol: 'NFLX', name: 'Netflix Inc.', current_price: 630.78 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', current_price: 950.32 },
      { symbol: 'V', name: 'Visa Inc.', current_price: 270.41 },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', current_price: 187.63 }
    ];
    
    const filteredStocks = mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return of(filteredStocks.slice(0, 10));
  }
  
  /**
   * Actualiza el horario de apertura personalizado para una acción/mercado específico
   * @param mic Identificador del mercado a actualizar
   * @param customTime Hora de apertura personalizada en formato 'HH:MM'
   */
  updateCustomOpeningTime(mic: string, customTime: string): Observable<Stock> {
    // En una implementación real, este endpoint debería existir en el backend
    // return this.http.patch<Stock>(`${this.apiUrl}/${mic}/custom-opening`, { custom_opening_time: customTime });
    
    // Como alternativa temporal, actualizamos la caché y simulamos una respuesta exitosa
    const index = this.stocksCache.findIndex(stock => stock.mic === mic);
    
    if (index !== -1) {
      const updatedStock = {
        ...this.stocksCache[index],
        custom_opening_time: customTime
      };
      
      this.stocksCache[index] = updatedStock;
      this.stocksSubject.next([...this.stocksCache]);
      
      // Simulamos almacenar esta configuración en localStorage para persistencia
      if (typeof localStorage !== 'undefined') {
        const customTimesKey = 'custom_opening_times';
        const storedTimes = JSON.parse(localStorage.getItem(customTimesKey) || '{}');
        storedTimes[mic] = customTime;
        localStorage.setItem(customTimesKey, JSON.stringify(storedTimes));
      }
      
      return of(updatedStock);
    }
    
    return throwError(() => new Error(`No se encontró el mercado con MIC: ${mic}`));
  }
  
  /**
   * Obtiene el horario de apertura personalizado para un mercado específico
   * @param mic Identificador del mercado
   */
  getCustomOpeningTime(mic: string): string | null {
    // Primero intentamos obtenerlo del caché
    const stock = this.stocksCache.find(s => s.mic === mic);
    if (stock?.custom_opening_time) {
      return stock.custom_opening_time;
    }
    
    // Si no está en caché, buscamos en localStorage
    if (typeof localStorage !== 'undefined') {
      const customTimesKey = 'custom_opening_times';
      const storedTimes = JSON.parse(localStorage.getItem(customTimesKey) || '{}');
      return storedTimes[mic] || null;
    }
    
    return null;
  }
}
