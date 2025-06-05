import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Portfolio, PortfolioSummary, Stock, PortfolioPosition } from "../models/portfolio.model";

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = environment.apiUrl;

  // BehaviorSubject para manejar los datos del portafolio
  private portfolioSubject = new BehaviorSubject<Portfolio | null>(null);
  portfolio$ = this.portfolioSubject.asObservable();

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

  constructor(private http: HttpClient) {
    // Inicializar el portafolio con datos simulados
    this.refreshPortfolioData();
  }

  /**
   * Actualiza los datos del portafolio desde el backend
   * @param sellData Datos de la venta para actualizar el portfolio si se proporciona
   */
  refreshPortfolioData(sellData?: { stockId: string, quantity: number }): void {
    // En producción, esto llamaría al backend
    // this.http.get<Portfolio>(`${this.apiUrl}/portfolio`).subscribe(...)
    
    // Si tenemos datos de venta, actualizamos el portafolio en memoria
    if (sellData) {
      const stockIndex = this.mockStocks.findIndex(stock => stock.id === sellData.stockId);
      if (stockIndex >= 0) {
        // Actualizar la cantidad después de la venta
        this.mockStocks[stockIndex].quantity -= sellData.quantity;
        
        // Si la cantidad llega a 0, consideramos eliminar la acción del portfolio
        if (this.mockStocks[stockIndex].quantity <= 0) {
          this.mockStocks.splice(stockIndex, 1);
        } else {
          // Recalcular el valor total
          this.mockStocks[stockIndex].totalValue = 
            this.mockStocks[stockIndex].quantity * this.mockStocks[stockIndex].unitValue;
        }
      }
    }
    
    // Simulación de datos para desarrollo
    const mockPortfolio: Portfolio = {
      id: '1',
      userId: 'user123',
      balance: 5000000,
      positions: this.mockStocks.map(stock => ({
        id: `pos-${stock.id}`,
        stock: stock,
        quantity: stock.quantity,
        averagePrice: stock.unitValue,
        totalInvested: stock.totalValue,
        currentValue: stock.totalValue * (1 + stock.performance/100)
      })),
      totalValue: this.mockStocks.reduce((acc, stock) => acc + stock.totalValue, 0),
      totalInvested: this.mockStocks.reduce((acc, stock) => acc + stock.totalValue, 0),
      performance: this.calculateAveragePerformance(this.mockStocks)
    };
    
    this.portfolioSubject.next(mockPortfolio);
  }

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

  /**
   * Obtiene el portafolio completo del usuario
   */
  getUserPortfolio(): Observable<Portfolio> {
    // Si ya tenemos el portafolio cargado, lo retornamos
    if (this.portfolioSubject.value) {
      return of(this.portfolioSubject.value);
    }
    
    // En producción, esto llamaría al backend
    // return this.http.get<Portfolio>(`${this.apiUrl}/portfolio`).pipe(
    //  tap(portfolio => this.portfolioSubject.next(portfolio))
    // );
    
    // Simulación para desarrollo
    this.refreshPortfolioData();
    return of(this.portfolioSubject.value!);
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

  /**
   * Calcula el rendimiento promedio en base a las acciones
   */
  private calculateAveragePerformance(stocks: Stock[]): number {
    const totalValue = stocks.reduce((acc, stock) => acc + stock.totalValue, 0);
    const weightedPerformance = stocks.reduce((acc, stock) => {
      const weight = stock.totalValue / totalValue;
      return acc + (stock.performance * weight);
    }, 0);
    
    return weightedPerformance;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      
      // Devuelve un resultado predeterminado para mantener la app funcionando
      return of(result as T);
    };
  }

  /**
   * Actualiza el saldo del usuario después de una transacción
   * @param amount Cantidad a añadir al saldo (positivo para ingresos, negativo para gastos)
   * @returns Observable con el nuevo saldo
   */
  updateUserBalance(amount: number): Observable<number> {
    // En producción, esto se haría con una llamada al backend
    // return this.http.post<{balance: number}>(`${this.apiUrl}/portfolio/balance/update`, {amount})
    //   .pipe(map(response => response.balance));
    
    // Versión mock para desarrollo
    return this.getUserPortfolio().pipe(
      map(portfolio => {
        // Actualizamos el saldo
        const newBalance = portfolio.balance + amount;
        
        // Simulamos persistencia local (para desarrollo)
        // En un entorno de producción, esto no sería necesario ya que vendría del backend
        portfolio.balance = newBalance;
        
        console.log(`Balance actualizado: Anterior: ${portfolio.balance - amount}, Nuevo: ${newBalance}, Cambio: ${amount > 0 ? '+' : ''}${amount}`);
        
        return newBalance;
      }),
      catchError(this.handleError<number>('updateUserBalance', 0))
    );
  }
  /**
   * Actualiza el portfolio después de una venta de acciones
   * @param stockId ID o símbolo de la acción vendida
   * @param quantity Cantidad de acciones vendidas
   */
  updatePortfolioAfterSell(stockId: string, quantity: number): void {
    if (this.portfolioSubject.value) {
      const portfolio = { ...this.portfolioSubject.value };
      
      // Actualizar las acciones en el array mock
      this.mockStocks = this.mockStocks.map(stock => {
        if (stock.id === stockId || stock.symbol === stockId) {
          const newQuantity = stock.quantity - quantity;
          
          // Si la cantidad llega a cero, podríamos remover la acción del portfolio
          if (newQuantity <= 0) {
            return null; // Lo filtraremos después
          }
          
          // Actualizamos la cantidad y el valor total
          return {
            ...stock,
            quantity: newQuantity,
            totalValue: newQuantity * stock.unitValue
          };
        }
        return stock;
      }).filter(Boolean) as Stock[]; // Filtra las acciones con cantidad cero

      // Actualizar las posiciones del portfolio
      portfolio.positions = portfolio.positions.map(position => {
        if (position.stock.id === stockId || position.stock.symbol === stockId) {
          const newQuantity = position.quantity - quantity;
          
          // Si la cantidad llega a cero, podríamos remover la posición
          if (newQuantity <= 0) {
            return null;
          }
          
          // Actualizamos la cantidad y los valores
          return {
            ...position,
            quantity: newQuantity,
            currentValue: newQuantity * position.stock.unitValue
          };
        }
        return position;
      }).filter(Boolean) as PortfolioPosition[];

      // Recalcular los totales del portfolio
      portfolio.totalValue = portfolio.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      portfolio.totalInvested = portfolio.positions.reduce((sum, pos) => sum + pos.totalInvested, 0);
      portfolio.performance = portfolio.totalInvested > 0 ? 
        ((portfolio.totalValue - portfolio.totalInvested) / portfolio.totalInvested) * 100 : 0;
      
      // Actualizar el subject
      this.portfolioSubject.next(portfolio);
      
      console.log('Portfolio actualizado después de venta:', portfolio);
    }
  }
}
