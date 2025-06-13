import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MarketClock } from '../models/stock.model';
import { StockBar } from '../models/share.model';
import { AlpacaNews, GetNewsParams } from '../models/news.model';
import { 
  AlpacaAssetsParams, 
  AlpacaBarsParams,
  AlpacaAuctionsParams,
  AlpacaNewsParams,
  AlpacaQuotesParams,
  AlpacaTradesParams,
  AlpacaBarsResponse,
  AlpacaAuctionsResponse,
  AlpacaQuoteResponse,
  AlpacaTradesResponse,
  AlpacaLatestQuoteResponse,
  AlpacaAsset
} from '../models/alpaca.model';

@Injectable({ providedIn: 'root' })
export class AlpacaDataService {
  // URLs base para diferentes endpoints de la API de Alpaca
  private baseUrl = environment.alpaca.baseUrl;            // Trading endpoints (v2 - clock, assets)
  private dataBaseUrl = environment.alpaca.dataBaseUrl;    // Data endpoints (v2 - bars, quotes, trades)
  private newsBaseUrl = 'https://data.alpaca.markets/v1beta1/news'; // Endpoint específico para noticias (v1beta1)
  
  // Headers comunes para todas las peticiones a Alpaca
  private headers = new HttpHeaders({
    'APCA-API-KEY-ID': environment.alpaca.apiKey,
    'APCA-API-SECRET-KEY': environment.alpaca.secretKey,
    'accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  getShareBars(symbol: string, params: AlpacaBarsParams): Observable<StockBar[]> {
    // Valores predeterminados para parámetros obligatorios si no se proporcionan
    if (!params.start) {
      const endDate = params.end ? new Date(params.end) : new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1); // Por defecto, 1 día atrás
      params.start = startDate.toISOString();
    }
    
    if (!params.end) {
      params.end = new Date().toISOString();
    }
    
    // Clonar los parámetros para no modificar el objeto original
    const paramsWithDefaults = { 
      ...params,
      timeframe: params.timeframe || '1Min',
      limit: params.limit || '500'
    };
    
    // Usar el método utilitario para construir los parámetros HTTP
    const httpParams = this.buildHttpParams(paramsWithDefaults);
    
    return this.http.get<AlpacaBarsResponse>(
      `${this.dataBaseUrl}/stocks/${symbol}/bars`, 
      { params: httpParams, headers: this.headers }
    ).pipe(
      map(response => {
        // Validar la estructura de la respuesta
        if (!response.bars || !Array.isArray(response.bars)) {
          console.warn('Formato de respuesta inesperado para barras:', response);
          return [];
        }
        
        // Transformar al formato StockBar esperado por la aplicación
        return response.bars.map(bar => ({
          t: bar.Timestamp,
          o: bar.OpenPrice,
          h: bar.HighPrice,
          l: bar.LowPrice,
          c: bar.ClosePrice,
          v: bar.Volume
        }));
      }),
      catchError(error => {
        console.error('Error al obtener barras históricas para', symbol, ':', error);
        // Proporcionar información más específica sobre el error
        const errorMsg = error.status === 403 
          ? `Error de permisos (403) al obtener barras para ${symbol}. Verifique su API Key.`
          : `Error al obtener barras históricas para ${symbol}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getAssets(paramsObj: AlpacaAssetsParams = {}): Observable<AlpacaAsset[]> {
    // Parámetros predeterminados
    const defaultParams: AlpacaAssetsParams = {
      status: 'active',
      asset_class: 'us_equity'
    };
    
    // Mezclar parámetros predeterminados con los proporcionados
    const params = { ...defaultParams, ...paramsObj };
    
    // Construir parámetros HTTP
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    
    return this.http.get<AlpacaAsset[]>(`${this.baseUrl}/assets`, { params: httpParams, headers: this.headers }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          console.warn('Formato de respuesta inesperado para assets:', response);
          return [];
        }
        
        // Por defecto, filtrar solo los activos negociables
        return response.filter(asset => asset.tradable);
      }),
      catchError(error => {
        console.error('Error al obtener assets de Alpaca:', error);
        const errorMsg = error.status === 403 
          ? 'Error de permisos (403) al obtener activos. Verifique su API Key.'
          : 'Error al obtener activos de Alpaca';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  

  getMarketStatus(): Observable<MarketClock> {
    return this.http.get<MarketClock>(`${this.baseUrl}/clock`, { headers: this.headers }).pipe(
      catchError(error => {
        console.error('Error al obtener estado de mercado:', error);
        const errorMsg = error.status === 403 
          ? 'Error de permisos (403) al obtener estado de mercado. Verifique su API Key.'
          : 'Error al obtener estado del mercado';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  

  getMarketCalendar(start?: string, end?: string): Observable<any[]> {
    let httpParams = new HttpParams();
    if (start) httpParams = httpParams.set('start', start);
    if (end) httpParams = httpParams.set('end', end);
    
    return this.http.get<any[]>(`${this.baseUrl}/calendar`, { params: httpParams, headers: this.headers }).pipe(
      catchError(error => {
        console.error('Error al obtener calendario del mercado:', error);
        const errorMsg = error.status === 403 
          ? 'Error de permisos (403) al obtener calendario. Verifique su API Key.'
          : 'Error al obtener calendario del mercado';
        return throwError(() => new Error(errorMsg));
      })
    );
  }


  getNews(paramsObj: GetNewsParams): Observable<AlpacaNews[]> {
    // Valores predeterminados
    const defaultSort = 'desc';
    const defaultLimit = 10;
    
    // Construir los parámetros HTTP
    let httpParams = new HttpParams();
    
    // Agregar primero el parámetro sort para que esté presente aunque venga en params
    httpParams = httpParams.set('sort', (paramsObj.sort || defaultSort).toLowerCase());
    
    // Límite predeterminado si no se proporciona
    if (!paramsObj.limit) {
      httpParams = httpParams.set('limit', defaultLimit.toString());
    } else {
      httpParams = httpParams.set('limit', paramsObj.limit.toString());
    }
    
    // Agregar el resto de parámetros
    if (paramsObj.symbols && paramsObj.symbols.length > 0) {
      httpParams = httpParams.set('symbols', paramsObj.symbols.join(','));
    }
    
    if (paramsObj.start) {
      httpParams = httpParams.set('start', paramsObj.start);
    }
    
    if (paramsObj.end) {
      httpParams = httpParams.set('end', paramsObj.end);
    }
    
    return this.http.get<any>(this.newsBaseUrl, { 
      params: httpParams,
      headers: this.headers 
    }).pipe(
      map(response => {
        if (!response.news || !Array.isArray(response.news)) {
          console.warn('Respuesta de noticias inesperada:', response);
          return [];
        }
        return response.news as AlpacaNews[];
      }),
      catchError(error => {
        console.error('Error al obtener noticias de Alpaca (v1beta1):', error);
        if (error.status === 403) {
          console.warn('Posible error de permisos en la API Key de Alpaca para noticias');
          return throwError(() => new Error('Error de permisos al obtener noticias de Alpaca. Verifique su API Key.'));
        }
        return throwError(() => new Error('Error al obtener noticias de Alpaca'));
      })
    );
  }

  getShareQuote(symbol: string): Observable<any> {
    return this.http.get<AlpacaLatestQuoteResponse>(`${this.dataBaseUrl}/stocks/${symbol}/quotes/latest`, { headers: this.headers }).pipe(
      map(response => {
        if (!response.quote) throw new Error('Formato de respuesta inesperado');
        return response.quote;
      }),
      catchError(error => {
        console.error(`Error al obtener cotización para ${symbol}:`, error);
        const errorMsg = error.status === 403 
          ? `Error de permisos (403) al obtener cotización para ${symbol}. Verifique su API Key.`
          : `Error al obtener cotización para ${symbol}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getQuotes(symbol: string, params: AlpacaQuotesParams): Observable<AlpacaQuoteResponse> {
    // Construir parámetros HTTP
    let httpParams = new HttpParams();
    
    // Agregar todos los parámetros proporcionados
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          httpParams = httpParams.set(key, value.join(','));
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });
    
    return this.http.get<AlpacaQuoteResponse>(
      `${this.dataBaseUrl}/stocks/${symbol}/quotes`, 
      { params: httpParams, headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error(`Error al obtener cotizaciones históricas para ${symbol}:`, error);
        const errorMsg = error.status === 403 
          ? `Error de permisos (403) al obtener cotizaciones para ${symbol}. Verifique su API Key.`
          : `Error al obtener cotizaciones históricas para ${symbol}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  getAuctions(symbol: string, params: AlpacaAuctionsParams): Observable<AlpacaAuctionsResponse> {
    // Usar el método utilitario para construir los parámetros HTTP
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<AlpacaAuctionsResponse>(
      `${this.dataBaseUrl}/stocks/${symbol}/auctions`, 
      { params: httpParams, headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener datos de subastas para', symbol, ':', error);
        const errorMsg = error.status === 403 
          ? `Error de permisos (403) al obtener subastas para ${symbol}. Verifique su API Key.`
          : `Error al obtener datos de subastas para ${symbol}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getTrades(symbol: string, params: AlpacaTradesParams): Observable<AlpacaTradesResponse> {
    // Usar el método utilitario para construir los parámetros HTTP
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<AlpacaTradesResponse>(
      `${this.dataBaseUrl}/stocks/${symbol}/trades`, 
      { params: httpParams, headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error(`Error al obtener operaciones para ${symbol}:`, error);
        const errorMsg = error.status === 403 
          ? `Error de permisos (403) al obtener operaciones para ${symbol}. Verifique su API Key.`
          : `Error al obtener operaciones para ${symbol}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  

  private buildHttpParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          httpParams = httpParams.set(key, value.join(','));
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });
    
    return httpParams;
  }
}
