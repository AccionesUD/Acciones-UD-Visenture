import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PortfolioSummary, Stock} from "../models/portfolio.model";

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = environment.apiUrl;

  // Datos de ejemplo para desarrollo
  private mockStocks: Stock[] = [
    {
      id: '1',
      company: 'Apple',
      symbol: 'AAPL',
      quantity: 10,
      unitValue: 185,
      marketName: 'NASDAQ',
      marketId: 'nasdaq',
      totalValue: 10 * 185,
      performance: 4.5,
      color: 'red'
    },
    {
      id: '2',
      company: 'Microsoft',
      symbol: 'MSFT',
      quantity: 15,
      unitValue: 330,
      marketName: 'NASDAQ',
      marketId: 'nasdaq',
      totalValue: 15 * 330,
      performance: 3.2,
      color: 'green'
    },
    {
      id: '3',
      company: 'Bank of America',
      symbol: 'BAC',
      quantity: 20,
      unitValue: 35,
      marketName: 'NYSE',
      marketId: 'nyse',
      totalValue: 20 * 35,
      performance: 1.8,
      color: 'purple'
    },
    {
      id: '4',
      company: 'Ecopetrol',
      symbol: 'ECOPETROL',
      quantity: 150,
      unitValue: 2450,
      marketName: 'BVC',
      marketId: 'bvc',
      totalValue: 150 * 2450,
      performance: 5.2,
      color: 'emerald'
    },
    {
      id: '5',
      company: 'Bancolombia',
      symbol: 'BCOLOMBIA',
      quantity: 80,
      unitValue: 32100,
      marketName: 'BVC',
      marketId: 'bvc',
      totalValue: 80 * 32100,
      performance: 8.7,
      color: 'blue'
    },
    {
      id: '6',
      company: 'Avianca',
      symbol: 'AVIANCA',
      quantity: 200,
      unitValue: 1890,
      marketName: 'BVC',
      marketId: 'bvc',
      totalValue: 200 * 1890,
      performance: -2.3,
      color: 'yellow'
    }
  ];

  constructor(private http: HttpClient) { }

  getPortfolioStocks(): Observable<Stock[]> {
    // En producción, descomentar esta línea y comentar el retorno del mock
    // return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/stocks`)
    //   .pipe(
    //     catchError(this.handleError<Stock[]>('getPortfolioStocks', []))
    //   );
    
    // Mock para desarrollo
    return of(this.mockStocks);
  }

  getPortfolioSummary(): Observable<PortfolioSummary> {
    // En producción:
    // return this.http.get<PortfolioSummary>(`${this.apiUrl}/portfolio/summary`)
    //   .pipe(
    //     catchError(this.handleError<PortfolioSummary>('getPortfolioSummary', this.calculateMockSummary()))
    //   );
    
    // Mock para desarrollo
    return of(this.calculateMockSummary());
  }

  getStocksByMarket(marketId: string): Observable<Stock[]> {
    // En producción:
    // return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/stocks/markets/${marketId}`)
    //   .pipe(
    //     catchError(this.handleError<Stock[]>(`getStocksByMarket id=${marketId}`, []))
    //   );
    
    // Mock para desarrollo
    if (marketId === 'ALL') {
      return of(this.mockStocks);
    } else {
      return of(this.mockStocks.filter(stock => stock.marketId === marketId.toLowerCase()));
    }
  }

  getStocksByPerformance(min?: number, max?: number): Observable<Stock[]> {
    // En producción:
    // Construir URL con parámetros opcionales
    // let url = `${this.apiUrl}/portfolio/stocks/performance`;
    // let params = new HttpParams();
    // if (min !== undefined) params = params.append('min', min.toString());
    // if (max !== undefined) params = params.append('max', max.toString());
    // return this.http.get<Stock[]>(url, { params })
    //   .pipe(
    //     catchError(this.handleError<Stock[]>('getStocksByPerformance', []))
    //   );
    
    // Mock para desarrollo
    return of(this.mockStocks.filter(stock => {
      if (min !== undefined && max !== undefined) {
        return stock.performance >= min && stock.performance <= max;
      } else if (min !== undefined) {
        return stock.performance >= min;
      } else if (max !== undefined) {
        return stock.performance <= max;
      }
      return true;
    }));
  }

  private calculateMockSummary(): PortfolioSummary {
    const totalInvested = this.mockStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalEarnings = this.mockStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0);
    
    return {
      totalInvested: totalInvested,
      totalEarnings: totalEarnings,
      totalStocks: this.mockStocks.reduce((sum, stock) => sum + stock.quantity, 0),
      totalValue: totalInvested + totalEarnings,
      performance: totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0
    };
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      
      // Devuelve un resultado predeterminado para mantener la app funcionando
      return of(result as T);
    };
  }
}
