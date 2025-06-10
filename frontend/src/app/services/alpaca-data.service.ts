import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AlpacaDataService {
  private baseUrl = 'https://data.alpaca.markets/v2';
  private headers = new HttpHeaders({
    'APCA-API-KEY-ID': 'TU_API_KEY',
    'APCA-API-SECRET-KEY': 'TU_SECRET_KEY'
  });

  constructor(private http: HttpClient) {}

  getStockBars(symbol: string, start: string, end: string, timeframe = '1Min') {
    const url = `${this.baseUrl}/stocks/${symbol}/bars`;
    const params = new HttpParams()
      .set('start', start)
      .set('end', end)
      .set('timeframe', timeframe)
      .set('limit', '100');

    return this.http.get<any>(url, { headers: this.headers, params }).pipe(
      map(response =>
        response.bars.map((bar: any) => ({
          x: bar.t,
          y: bar.c
        }))
      )
    );
  }
}
