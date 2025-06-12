import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MarketClock } from '../models/stock.model';
import { StockBar } from '../models/share.model';
import { AlpacaNews, GetNewsParams } from '../models/news.model';

@Injectable({ providedIn: 'root' })
export class AlpacaDataService {
  private baseUrl = environment.alpaca.baseUrl;
  private dataBaseUrl = 'https://data.alpaca.markets/v2'; // URL específica para datos de mercado
  private headers = new HttpHeaders({
    'APCA-API-KEY-ID': environment.alpaca.apiKey,
    'APCA-API-SECRET-KEY': environment.alpaca.secretKey
  });

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las barras de datos de una acción (share) para un gráfico
   */
  getShareBars(symbol: string, start: Date, end: Date, timeframe = '1Min'): Observable<any[]> {
    const validTimeframes = ['1Min', '5Min', '15Min', '1H', '1D'];
    if (!validTimeframes.includes(timeframe)) {
      timeframe = '1Min'; // Valor por defecto
    }
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('timeframe', timeframe)
      .set('limit', '100');

    return this.http.get<any>(`${this.dataBaseUrl}/stocks/${symbol}/bars`, { headers: this.headers, params }).pipe(
      map(response => {
        if (!response.bars) {
          throw new Error('Formato de respuesta inesperado');
        }
        return response.bars.map((bar: any) => ({
          x: new Date(bar.t).getTime(), // Asegurar formato correcto para ApexCharts
          y: bar.c
        }));
      }),
      catchError(error => {
        console.error('Error en la API de Alpaca:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    );
  }

  /**
   * Obtiene todos los activos disponibles
   */
  getAssets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/assets`, { headers: this.headers }).pipe(
      map(assets => assets.filter(asset => asset.tradable && asset.status === 'active')),
      catchError(error => {
        console.error('Error al obtener assets de Alpaca:', error);
        return throwError(() => new Error('Error al obtener assets de Alpaca'));
      })
    );
  }
  
  /**
   * Obtiene el estado actual del mercado
   */
  getMarketStatus(): Observable<any> {
    return this.http.get<any>(`${this.dataBaseUrl}/clock`, { headers: this.headers }).pipe(
      catchError(error => {
        console.error('Error al obtener estado del mercado:', error);
        
        // Valores predeterminados en caso de error
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 30, 0, 0);
        
        return of({
          timestamp: now.toISOString(),
          is_open: false,
          next_open: tomorrow.toISOString(),
          next_close: tomorrow.toISOString()
        });
      })
    );
  }
  
  /**
   * Obtiene noticias relacionadas con los activos
   */
  getNews(params: GetNewsParams): Observable<AlpacaNews[]> {
    let httpParams = new HttpParams();
    
    if (params.symbols && params.symbols.length > 0) {
      httpParams = httpParams.set('symbols', params.symbols.join(','));
    }
    
    if (params.start) {
      httpParams = httpParams.set('start', params.start);
    }
    
    if (params.end) {
      httpParams = httpParams.set('end', params.end);
    }
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    
    return this.http.get<AlpacaNews[]>(`${this.dataBaseUrl}/news`, { headers: this.headers, params: httpParams }).pipe(
      catchError(error => {
        console.error('Error al obtener noticias de Alpaca:', error);
        return this.getMockNews(params.symbols || []);
      })
    );
  }
  
  /**
   * Obtiene la cotización más reciente de una acción
   */
  getShareQuote(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.dataBaseUrl}/stocks/${symbol}/quotes/latest`, { headers: this.headers }).pipe(
      map(response => {
        if (!response.quote) {
          throw new Error('Formato de respuesta inesperado');
        }
        return response.quote;
      }),
      catchError(error => {
        console.error(`Error al obtener cotización para ${symbol}:`, error);
        return throwError(() => new Error(`Error al obtener cotización para ${symbol}`));
      })
    );
  }
  
  /**
   * Método privado para obtener noticias simuladas (mock) en caso de error en la API
   */
  private getMockNews(symbols: string[]): Observable<AlpacaNews[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const mockNews: AlpacaNews[] = [
      {
        ID: 1001,
        Headline: 'Los mercados globales muestran signos de recuperación',
        Author: 'Ana Martínez',
        CreatedAt: yesterday.toISOString(),
        UpdatedAt: yesterday.toISOString(),
        Summary: 'Los principales índices bursátiles muestran una tendencia alcista tras las recientes medidas económicas.',
        URL: 'https://example.com/news/1001',
        Images: ['https://example.com/images/markets.jpg'],
        Symbols: ['SPY', 'QQQ'],
        Source: 'finanzas-hoy'
      },
      {
        ID: 1002,
        Headline: 'Apple anuncia nuevos productos para el próximo trimestre',
        Author: 'Carlos Rodríguez',
        CreatedAt: today.toISOString(),
        UpdatedAt: today.toISOString(),
        Summary: 'La compañía tecnológica sorprende con innovaciones en su línea de productos principales.',
        URL: 'https://example.com/news/1002',
        Images: ['https://example.com/images/apple-products.jpg'],
        Symbols: ['AAPL'],
        Source: 'tech-news'
      }
    ];
    
    // Si se especificaron símbolos, filtrar las noticias
    if (symbols && symbols.length > 0) {
      return of(mockNews.filter(news => 
        news.Symbols.some(sym => symbols.includes(sym))
      ));
    }
    
    return of(mockNews);
  }
}
