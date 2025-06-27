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

  getPortfolioHistory(days: number = 30): Observable<any[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any[]>(`${this.apiUrl}/history`, { params });
  }

  sellShare(order: SellOrder): Observable<SellResponse> {
    return this.http.post<SellResponse>(`${this.apiUrl}/sell`, order);
  }

  updatePortfolioAfterSell(stockId: string, quantity: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/shares/${stockId}`, { quantity });
  }

  updateUserBalance(amount: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/balance`, { amount });
  }

  /**
   * Obtiene el portafolio de un cliente específico (para comisionistas)
   * @param clientId ID del cliente
   * @returns Observable con las acciones del cliente
   */
  getClientPortfolio(clientId: number): Observable<any[]> {
    // En producción: return this.http.get<any[]>(`${this.apiUrl}/clients/${clientId}/shares`);
    
    // Para desarrollo, simular datos
    if (clientId > 0) {
      // Generar un portfolio aleatorio para cada cliente basado en su ID
      const portfolioSize = (clientId % 5) + 1; // Entre 1 y 5 acciones
      const mockPortfolio: any[] = [];
      
      const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'NVDA', 'V', 'JPM'];
      const names = [
        'Apple Inc.', 
        'Microsoft Corporation', 
        'Alphabet Inc.', 
        'Amazon.com Inc.', 
        'Meta Platforms Inc.', 
        'Tesla Inc.', 
        'Netflix Inc.', 
        'NVIDIA Corporation', 
        'Visa Inc.', 
        'JPMorgan Chase & Co.'
      ];
      
      // Seleccionar acciones basadas en el ID del cliente
      const startIndex = clientId % tickers.length;
      for (let i = 0; i < portfolioSize; i++) {
        const index = (startIndex + i) % tickers.length;
        const quantity = 5 + (clientId % 20); // Entre 5 y 24 acciones
        const price = 100 + (index * 10) + (clientId % 50); // Precio base + variación
        
        mockPortfolio.push({
          symbol: tickers[index],
          name: names[index],
          quantity: quantity,
          purchase_price: price * 0.9, // Precio de compra ligeramente menor
          current_price: price,
          market_value: price * quantity,
          total_return: price * quantity * 0.1, // 10% de ganancia
          return_percentage: 10, // 10% de ganancia
          last_updated: new Date().toISOString()
        });
      }
      
      return of(mockPortfolio);
    }
    
    // Si no hay ID de cliente válido
    return of([]);
  }

  /**
   * Obtiene las órdenes del usuario
   */
  getOrders(): Observable<any> {
    const url = `${environment.apiUrl}/accounts/orders`;
    return this.http.get<any>(url).pipe(
      map(res => {
        console.log('[PortfolioService] Respuesta de getOrders:', res);
        return res;
      }),
      catchError(error => {
        console.error('[PortfolioService] Error al obtener órdenes:', error);
        return of([]);
      })
    );
  }
}
