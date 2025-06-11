import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import{of} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlpacaDataService {
  private baseUrl = 'https://data.alpaca.markets/v2';
  private headers = new HttpHeaders({
    'APCA-API-KEY-ID': 'PKQ306VP6O0TZJTI003J',
    'APCA-API-SECRET-KEY': 'dGmY0cbCLmpedASnKfdSBkAVDD2coc3N7xHLlRyw'
  });

  constructor(private http: HttpClient) {}

  getStockBars(symbol: string, start: Date, end: Date, timeframe = '1Min') {
    const url = `${this.baseUrl}/stocks/${symbol}/bars`;
     const validTimeframes = ['1Min', '5Min', '15Min', '1H', '1D'];
    if (!validTimeframes.includes(timeframe)) {
      timeframe = '1Min'; // Valor por defecto
    }
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('timeframe', timeframe)
      .set('limit', '100');

    return this.http.get<any>(`${this.baseUrl}/stocks/${symbol}/bars`, { headers: this.headers,params }).pipe(
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
  getMarkets() {
    const url = `${this.baseUrl}/assets`;
    return this.http.get<any[]>(url, { headers: this.headers }).pipe(
      map(markets =>
        markets.map(market => ({
          symbol: market.symbol,
          name: market.name,
          price: market.last_trade ? market.last_trade.price : 0
        }))
      )
    );
  }

}
