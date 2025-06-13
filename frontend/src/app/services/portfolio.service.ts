import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Portfolio, PortfolioShare, PortfolioSummary, PortfolioPosition } from '../models/portfolio.model';
import { SellOrder, SellResponse } from '../models/sell.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = `${environment.apiUrl}/portfolio`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el portafolio completo del usuario
   */
  getPortfolio(): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}`);
  }

  /**
   * Obtiene las posiciones de acciones en el portafolio
   */
  getPortfolioPositions(): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${this.apiUrl}/positions`);
  }

  /**
   * Obtiene el resumen del portafolio (inversiones, ganancias, etc.)
   */
  getPortfolioSummary(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/summary`);
  }

  /**
   * Obtiene la lista de acciones en el portafolio
   * Usamos endpoint de shares y en caso de error retornamos mocks
   */
  getPortfolioStocks(): Observable<PortfolioShare[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/shares`).pipe(
      map(shares => shares.map(s => ({
        id: s.symbol,
        companyName: s.name_share,
        ticker: s.symbol,
        stockName: s.stock?.name_market || '',
        stockMic: s.stock?.mic || '',
        quantity: 0,
        unitValue: 0,
        totalValue: 0,
        performance: 0,
        color: '#cccccc'
      }))) ,
      catchError(error => {
        console.error('Error getPortfolioStocks, usando mocks:', error);
        return of(this.getFallbackPortfolioShares());
      })
    );
  }

  /** Genera datos mock para el portafolio si no hay datos reales */
  private getFallbackPortfolioShares(): PortfolioShare[] {
    return [
      { id: 'AAPL1', companyName: 'Apple Inc.', ticker: 'AAPL', stockName: 'NASDAQ', stockMic: 'XNAS', quantity: 5, unitValue: 150, totalValue: 750, performance: 2, color: '#00FF00' },
      { id: 'MSFT1', companyName: 'Microsoft Corp.', ticker: 'MSFT', stockName: 'NASDAQ', stockMic: 'XNAS', quantity: 3, unitValue: 250, totalValue: 750, performance: 3, color: '#0000FF' }
    ];
  }

  /**
   * Obtiene el historial de rendimiento del portafolio para un rango de días
   * @param days Número de días a consultar (por defecto 30)
   */
  getPortfolioHistory(days: number = 30): Observable<any[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any[]>(`${this.apiUrl}/history`, { params });
  }

  /**
   * Ejecuta una orden de venta de acciones
   * @param order Detalles de la orden de venta
   */
  sellShare(order: SellOrder): Observable<SellResponse> {
    return this.http.post<SellResponse>(`${this.apiUrl}/sell`, order);
  }

  /**
   * Actualiza la cantidad de acciones luego de una venta
   * @param stockId ID de la acción vendida
   * @param quantity Nueva cantidad restante en portafolio
   */
  updatePortfolioAfterSell(stockId: string, quantity: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/shares/${stockId}`, { quantity });
  }

  /**
   * Actualiza el balance de usuario tras una operación de venta
   * @param amount Monto a ajustar al balance
   */
  updateUserBalance(amount: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/balance`, { amount });
  }
}
