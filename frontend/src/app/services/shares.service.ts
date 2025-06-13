import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Share, CreateShareDto, StockBar } from '../models/share.model';

@Injectable({
  providedIn: 'root'
})
export class SharesService {
  private apiUrl = `${environment.apiUrl}/shares`;
  private sharesCache: Map<string, Share[]> = new Map(); // Cache por mercado (MIC)
  
  constructor(private http: HttpClient) { }
  
  /**
   * Obtiene todas las acciones disponibles
   */
  getAllShares(): Observable<Share[]> {
    return this.http.get<Share[]>(this.apiUrl).pipe(
      tap(shares => console.log(`Obtenidas ${shares.length} acciones`)),
      catchError(error => {
        console.error('Error al obtener acciones:', error);
        return throwError(() => new Error('Error al obtener acciones'));
      })
    );
  }
  
  /**
   * Busca una acción por su símbolo/ticker
   */
  getShareBySymbol(symbol: string): Observable<Share> {
    return this.http.get<Share>(`${this.apiUrl}/search?symbol=${symbol}`).pipe(
      tap(share => console.log(`Acción ${symbol} encontrada:`, share)),
      catchError(error => {
        console.error(`Error al buscar acción ${symbol}:`, error);
        return throwError(() => new Error(`Error al buscar acción ${symbol}`));
      })
    );
  }
  
  /**
   * Obtiene acciones por mercado (Stock MIC)
   * Primero intenta obtener del caché, si no está, hace la petición al backend
   */
  getSharesByMarket(stockMic: string): Observable<Share[]> {
    // Verificamos si tenemos datos en caché para este mercado
    if (this.sharesCache.has(stockMic)) {
      return of(this.sharesCache.get(stockMic) || []);
    }
    
    // Si no hay en caché, hacemos la solicitud al backend para obtener todas las acciones
    // y luego filtramos por el mercado que nos interesa
    return this.getAllShares().pipe(
      map(shares => shares.filter(share => share.mic_stock_market === stockMic)),
      tap(shares => {
        console.log(`Obtenidas ${shares.length} acciones para el mercado ${stockMic}`);
        // Guardamos en caché
        this.sharesCache.set(stockMic, shares);
      }),
      catchError(error => {
        console.error(`Error al obtener acciones para el mercado ${stockMic}:`, error);
        
        // Si falla, usamos datos de respaldo
        const fallbackShares = this.getFallbackShares(stockMic);
        this.sharesCache.set(stockMic, fallbackShares);
        return of(fallbackShares);
      })
    );
  }
  
  /**
   * Registra una nueva acción usando solo el símbolo
   * Este método usa el endpoint simplificado que solo requiere el símbolo
   */
  createShare(shareData: CreateShareDto): Observable<Share> {
    // Si solo se proporciona el símbolo, usamos el endpoint simplificado
    if (shareData.symbol) {
      return this.http.post<Share>(`${this.apiUrl}/new`, { symbol: shareData.symbol }).pipe(
        tap(share => {
          console.log('Acción registrada usando símbolo:', share);
          // Invalidamos la caché para que se vuelva a cargar
          this.sharesCache.clear();
        }),
        catchError(error => {
          console.error('Error al registrar acción:', error);
          return throwError(() => new Error('Error al registrar acción'));
        })
      );
    }
    
    // Si se provee información completa, usamos el endpoint completo
    return this.http.post<Share>(`${this.apiUrl}/register`, shareData).pipe(
      tap(share => {
        console.log('Acción registrada:', share);
        // Invalidamos la caché para que se vuelva a cargar
        this.sharesCache.clear();
        
        // Si tenemos el mercado específico, actualizamos esa entrada
        if (shareData.mic_stock_market && this.sharesCache.has(shareData.mic_stock_market)) {
          const currentShares = this.sharesCache.get(shareData.mic_stock_market) || [];
          this.sharesCache.set(shareData.mic_stock_market, [...currentShares, share]);
        }
      }),
      catchError(error => {
        console.error('Error al registrar acción:', error);
        return throwError(() => new Error('Error al registrar acción'));
      })
    );
  }
  
  /**
   * Obtiene datos históricos de precios para una acción específica
   */
  getSharePriceHistory(ticker: string, startDate: Date, endDate: Date): Observable<StockBar[]> {
    const params = new HttpParams()
      .set('symbol', ticker)
      .set('start', startDate.toISOString())
      .set('end', endDate.toISOString());
    
    return this.http.get<StockBar[]>(`${this.apiUrl}/prices`, { params }).pipe(
      tap(data => console.log(`Datos históricos obtenidos para ${ticker}:`, data)),
      catchError(error => {
        console.error(`Error al obtener histórico de precios para ${ticker}:`, error);
        return throwError(() => new Error(`Error al obtener histórico de precios para ${ticker}`));
      })
    );
  }
  
  /**
   * Datos de respaldo si el backend no está disponible
   */
  private getFallbackShares(stockMic: string): Share[] {
    console.warn(`Usando datos de respaldo para acciones del mercado ${stockMic}`);
    
    // Datos de ejemplo según el mercado
    switch (stockMic) {
      case 'XNYS': // NYSE
        return [
          {
            ticker: 'AAPL',
            name_share: 'Apple Inc.',
            class: 'Common Stock',
            sector: 'Technology',
            status: true,
            tradable: true,
            mic_stock_market: 'XNYS'
          },
          {
            ticker: 'MSFT',
            name_share: 'Microsoft Corporation',
            class: 'Common Stock',
            sector: 'Technology',
            status: true,
            tradable: true,
            mic_stock_market: 'XNYS'
          },
          {
            ticker: 'AMZN',
            name_share: 'Amazon.com Inc.',
            class: 'Common Stock',
            sector: 'Consumer Cyclical',
            status: true,
            tradable: true,
            mic_stock_market: 'XNYS'
          }
        ];
        
      case 'XMAD': // Madrid
        return [
          {
            ticker: 'SAN',
            name_share: 'Banco Santander S.A.',
            class: 'Common Stock',
            sector: 'Financial Services',
            status: true,
            tradable: true,
            mic_stock_market: 'XMAD'
          },
          {
            ticker: 'TEF',
            name_share: 'Telefónica S.A.',
            class: 'Common Stock',
            sector: 'Communication Services',
            status: true,
            tradable: true,
            mic_stock_market: 'XMAD'
          }
        ];
      
      default:
        return [
          {
            ticker: 'DEMO1',
            name_share: 'Demo Stock 1',
            class: 'Common Stock',
            sector: 'Technology',
            status: true,
            tradable: true,
            mic_stock_market: stockMic
          },
          {
            ticker: 'DEMO2',
            name_share: 'Demo Stock 2',
            class: 'Common Stock',
            sector: 'Financial',
            status: true,
            tradable: true,
            mic_stock_market: stockMic
          }
        ];
    }
  }
}
