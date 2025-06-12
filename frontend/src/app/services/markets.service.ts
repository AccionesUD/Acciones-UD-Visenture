import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { delay, tap, catchError, map, switchMap } from 'rxjs/operators';
import { Market } from '../models/market.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { StocksService } from './stocks.service';
import { AlpacaDataService } from './alpaca-data.service';
import { Stock } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class MarketServiceService {
  private apiUrl = `${environment.apiUrl}/market`;
  private marketsSubject = new BehaviorSubject<Market[] | null>(null);
  public markets$ = this.marketsSubject.asObservable();

  // Cache de mercados para optimizar las solicitudes
  private marketsCache: Market[] = [];

  constructor(
    private http: HttpClient,
    private stocksService: StocksService,
    private alpacaService: AlpacaDataService
  ) { }

  getMarkets(): Observable<Market[]> {
    // Si tenemos datos en caché, los usamos primero mientras actualizamos
    if (this.marketsCache.length > 0) {
      this.marketsSubject.next(this.marketsCache);
    }
    
    // Obtenemos los mercados del backend
    return this.stocksService.getMarkets().pipe(
      // Combinamos con el estado actual del mercado desde Alpaca
      switchMap(markets => {
        return forkJoin([
          of(markets), 
          this.alpacaService.getMarketStatus()
        ]);
      }),
      map(([markets, marketStatus]) => {
        // Convertimos los mercados del backend al formato del frontend
        return markets.map(market => this.adaptMarketFromBackend(market, marketStatus));
      }),
      tap(markets => {
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
        m.symbol === id || m.id === id || m.name === id
      );
      
      if (cachedMarket) {
        return of(cachedMarket);
      }
    }
    
    // Si no está en caché, obtenemos todos los mercados y filtramos
    return this.getMarkets().pipe(
      map(markets => markets.find(m => m.symbol === id || m.id === id || m.name === id)),
      catchError(error => {
        console.error(`Error al buscar mercado ${id}:`, error);
        return throwError(() => new Error(`Mercado con ID: ${id} no encontrado.`));
      })
    );
  }

  // Nuevo método para obtener detalles del mercado que incluye estado actual
  getMarketDetails(id: string): Observable<Market | undefined> {
    return this.getMarketById(id).pipe(
      switchMap(market => {
        if (!market) {
          return throwError(() => new Error(`Mercado con ID: ${id} no encontrado.`));
        }
        
        // Obtenemos información actualizada del estado del mercado
        return this.alpacaService.getMarketStatus().pipe(
          map(marketStatus => {
            return {
              ...market,
              status: marketStatus.is_open ? 'open' : 'closed',
              nextOpeningTime: marketStatus.next_open,
              nextClosingTime: marketStatus.next_close
            };
          })
        );
      })
    );
  }

  private adaptMarketFromBackend(backendMarket: Stock, marketStatus: any): Market {
    // Convertir al formato Market que espera el frontend
    const market: Market = {
      id: backendMarket.mic,
      symbol: backendMarket.mic,
      name: backendMarket.name_market,
      country: backendMarket.country_region,
      currency: 'USD', // Por defecto USD para NYSE y NASDAQ
      status: marketStatus.is_open ? 'open' : 'closed',
      isActive: backendMarket.status === 'active',
      // Campos adicionales del frontend
      description: `${backendMarket.name_market} (${backendMarket.mic}) es un mercado financiero ubicado en ${backendMarket.country_region}`,
      openingTime: backendMarket.opening_time,
      closingTime: backendMarket.closing_time,
      timezone: 'America/New_York', // Por defecto para NYSE y NASDAQ
      iconUrl: backendMarket.logo || this.getDefaultLogoForMarket(backendMarket.mic)
    };
    
    return market;
  }
  
  private getDefaultLogoForMarket(mic: string): string {
    const logos: {[key: string]: string} = {
      'XNYS': 'https://upload.wikimedia.org/wikipedia/commons/6/61/NYSE_logo.svg',
      'XNAS': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/NASDAQ_Logo.svg'
    };
    
    return logos[mic] || 'assets/images/default-market-logo.png';
  }

  private handleError(error: any): Observable<Market[]> {
    console.error('Error en MarketService:', error);
    // Si hay un error, podríamos usar datos de caché o datos mock como fallback
    if (this.marketsCache.length > 0) {
      return of(this.marketsCache);
    }
    
    // Si todo falla, retornamos un array vacío para evitar errores en la UI
    return of([]);
  }
}
