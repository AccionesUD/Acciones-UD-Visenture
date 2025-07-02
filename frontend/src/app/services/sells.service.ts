import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { PortfolioShare } from '../models/portfolio.model';
import { SellOrder } from '../models/sell.model';
import { environment } from '../../environments/environment';
import { PortfolioService } from './portfolio.service';

@Injectable({
  providedIn: 'root',
})
export class SellsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private portfolioService: PortfolioService
  ) {}

  submitSellOrder(order: SellOrder): Observable<any> {
    const sellOrder = {
      ...order,
      side: 'sell',
    };
    return this.http
      .post<any>(`${this.apiUrl}/orders`, sellOrder, { observe: 'response' })
      .pipe(
        tap((resp) => {
          console.log('[SellsService] Raw response from backend:', resp);
        }),
        map((resp: any) => {
          const body = resp?.body || resp;
          if (body && typeof body === 'object') {
            if (typeof body.success === 'boolean') {
              return { ...body, httpStatus: resp.status };
            } else if (typeof body.status === 'boolean') {
              return { ...body, success: body.status, httpStatus: resp.status };
            }
          }
          return {
            success: false,
            message: body?.message || 'Unexpected server response',
            data: body,
            httpStatus: resp.status,
          };
        })
      );
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/orders/${orderId}`, { observe: 'response' }).pipe(
      tap(resp => {
        console.log('[SellsService] Raw response from backend:', resp);
      }),
      map((resp: any) => {
        const body = resp?.body || resp;
        if (body && typeof body === 'object') {
          if (typeof body.success === 'boolean') {
            return { ...body, httpStatus: resp.status };
          } else if (typeof body.status === 'boolean') {
            return { ...body, success: body.status, httpStatus: resp.status };
          }
        }
        return { success: false, message: body?.message || 'Unexpected server response', data: body, httpStatus: resp.status };
      })
    );
  }

  getAvailableStocksForSelling(): Observable<PortfolioShare[]> {
    return this.portfolioService.getPortfolioStocks().pipe(
      tap((shares) => console.log('Available stocks for selling:', shares)),
      catchError(this.handleError<PortfolioShare[]>('getAvailableStocksForSelling', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      console.log(`${operation} error: ${error.message}`);
      return of(result as T);
    };
  }
}
