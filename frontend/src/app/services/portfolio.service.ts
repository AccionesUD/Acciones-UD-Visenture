import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Portfolio, PortfolioSummary, PortfolioShare, PortfolioPosition } from "../models/portfolio.model";

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = environment.apiUrl;

  // BehaviorSubject para manejar los datos del portafolio
  private portfolioSubject = new BehaviorSubject<Portfolio | null>(null);
  portfolio$ = this.portfolioSubject.asObservable();

  // Datos de ejemplo para desarrollo
  private mockShares: PortfolioShare[] = [
    {
      id: '1',
      companyName: 'Apple',
      ticker: 'AAPL',
      quantity: 10,
      unitValue: 185,
      stockName: 'NASDAQ',
      stockMic: 'XNAS',
      totalValue: 10 * 185,
      performance: 4.5,
      color: 'red'
    },
    {
      id: '2',
      companyName: 'Microsoft',
      ticker: 'MSFT',
      quantity: 15,
      unitValue: 330,
      stockName: 'NASDAQ',
      stockMic: 'XNAS',
      totalValue: 15 * 330,
      performance: 3.2,
      color: 'green'
    },
    {
      id: '3',
      companyName: 'Bank of America',
      ticker: 'BAC',
      quantity: 20,
      unitValue: 35,
      stockName: 'NYSE',
      stockMic: 'XNYS',
      totalValue: 20 * 35,
      performance: -1.2,
      color: 'blue'
    },
    {
      id: '4',
      companyName: 'Tesla',
      ticker: 'TSLA',
      quantity: 5,
      unitValue: 256,
      stockName: 'NASDAQ',
      stockMic: 'XNAS',
      totalValue: 5 * 256,
      performance: 7.8,
      color: 'purple'
    },
    {
      id: '5',
      companyName: 'Amazon',
      ticker: 'AMZN',
      quantity: 8,
      unitValue: 135,
      stockName: 'NASDAQ',
      stockMic: 'XNAS',
      totalValue: 8 * 135,
      performance: 2.3,
      color: 'orange'
    }
  ];

  constructor(private http: HttpClient) {
    // Cargamos datos iniciales
    this.loadInitialData();
  }

  /**
   * Carga los datos iniciales del portafolio
   */
  private loadInitialData(): void {
    // Primero intentamos cargar desde el backend
    this.getUserPortfolio().subscribe({
      next: (portfolio) => {
        this.portfolioSubject.next(portfolio);
      },
      error: (err) => {
        console.error('Error al cargar portafolio del backend:', err);
        // Si hay error, usamos datos de prueba
        this.portfolioSubject.next(this.generateMockPortfolio());
      }
    });
  }

  /**
   * Obtiene el portafolio del usuario desde el backend
   */
  getUserPortfolio(): Observable<Portfolio> {
    const userId = this.getUserId();
    return this.http.get<Portfolio>(`${this.apiUrl}/portfolio/${userId}`).pipe(
      tap((portfolio) => console.log('Portafolio cargado:', portfolio)),
      catchError((error) => {
        console.error('Error al obtener portafolio:', error);
        return of(this.generateMockPortfolio());
      })
    );
  }

  /**
   * Obtiene el resumen del portafolio del usuario
   */
  getPortfolioSummary(): Observable<PortfolioSummary> {
    const portfolio = this.portfolioSubject.getValue();
    
    if (portfolio) {
      // Si ya tenemos el portafolio, extraemos el resumen
      const summary: PortfolioSummary = {
        totalInvested: portfolio.totalInvested,
        totalEarnings: portfolio.totalValue - portfolio.totalInvested,
        totalShares: portfolio.positions.length,
        totalValue: portfolio.totalValue,
        performance: portfolio.performance
      };
      return of(summary);
    } else {
      // Si no tenemos portafolio, lo cargamos primero
      return this.getUserPortfolio().pipe(
        map((portfolio) => {
          return {
            totalInvested: portfolio.totalInvested,
            totalEarnings: portfolio.totalValue - portfolio.totalInvested,
            totalShares: portfolio.positions.length,
            totalValue: portfolio.totalValue,
            performance: portfolio.performance
          };
        })
      );
    }
  }

  /**
   * Obtiene todas las acciones del portafolio
   */
  getPortfolioShares(): Observable<PortfolioShare[]> {
    const portfolio = this.portfolioSubject.getValue();
    
    if (portfolio) {
      // Si ya tenemos el portafolio, extraemos las acciones
      const shares = portfolio.positions.map(position => position.share);
      return of(shares);
    } else {
      // Si no tenemos portafolio, lo cargamos primero
      return this.getUserPortfolio().pipe(
        map((portfolio) => {
          return portfolio.positions.map(position => position.share);
        })
      );
    }
  }
  
  /**
   * Compra una acción para el portafolio
   * @param ticker Símbolo de la acción
   * @param quantity Cantidad a comprar
   * @param price Precio unitario
   */
  buyShare(ticker: string, quantity: number, price: number): Observable<Portfolio> {
    const userId = this.getUserId();
    
    const buyData = {
      ticker,
      quantity,
      price
    };
    
    return this.http.post<Portfolio>(`${this.apiUrl}/portfolio/${userId}/buy`, buyData).pipe(
      tap((updatedPortfolio) => {
        console.log('Acción comprada:', ticker, quantity, price);
        this.portfolioSubject.next(updatedPortfolio);
      }),
      catchError((error) => {
        console.error('Error al comprar acción:', error);
        
        // Para desarrollo, simulamos la compra
        const currentPortfolio = this.portfolioSubject.getValue() || this.generateMockPortfolio();
        const mockUpdatedPortfolio = this.simulateBuy(currentPortfolio, ticker, quantity, price);
        this.portfolioSubject.next(mockUpdatedPortfolio);
        
        return of(mockUpdatedPortfolio);
      })
    );
  }
  
  /**
   * Vende una acción del portafolio
   * @param ticker Símbolo de la acción
   * @param quantity Cantidad a vender
   * @param price Precio unitario
   */
  sellShare(ticker: string, quantity: number, price: number): Observable<Portfolio> {
    const userId = this.getUserId();
    
    const sellData = {
      ticker,
      quantity,
      price
    };
    
    return this.http.post<Portfolio>(`${this.apiUrl}/portfolio/${userId}/sell`, sellData).pipe(
      tap((updatedPortfolio) => {
        console.log('Acción vendida:', ticker, quantity, price);
        this.portfolioSubject.next(updatedPortfolio);
      }),
      catchError((error) => {
        console.error('Error al vender acción:', error);
        
        // Para desarrollo, simulamos la venta
        const currentPortfolio = this.portfolioSubject.getValue() || this.generateMockPortfolio();
        const mockUpdatedPortfolio = this.simulateSell(currentPortfolio, ticker, quantity, price);
        this.portfolioSubject.next(mockUpdatedPortfolio);
        
        return of(mockUpdatedPortfolio);
      })
    );
  }

  /**
   * Obtiene los datos históricos del portafolio
   * @param days Número de días para el histórico
   */
  getPortfolioHistory(days: number = 30): Observable<any[]> {
    const userId = this.getUserId();
    
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/portfolio/${userId}/history`, { params }).pipe(
      catchError((error) => {
        console.error('Error al obtener histórico del portafolio:', error);
        return this.generateMockHistory(days);
      })
    );
  }

  /**
   * Genera un portafolio con datos de prueba
   */
  private generateMockPortfolio(): Portfolio {
    const positions: PortfolioPosition[] = this.mockShares.map(share => ({
      id: `pos-${share.id}`,
      share,
      quantity: share.quantity,
      averagePrice: share.unitValue * 0.9, // Precio de compra ligeramente menor
      totalInvested: share.quantity * share.unitValue * 0.9,
      currentValue: share.quantity * share.unitValue
    }));
    
    const totalInvested = positions.reduce((sum, pos) => sum + pos.totalInvested, 0);
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const performance = ((totalValue / totalInvested) - 1) * 100;
    
    return {
      id: 'mock-portfolio',
      userId: this.getUserId(),
      balance: 10000, // Saldo disponible
      positions,
      totalInvested,
      totalValue,
      performance
    };
  }
  
  /**
   * Simula la compra de una acción para modo de desarrollo
   */
  private simulateBuy(portfolio: Portfolio, ticker: string, quantity: number, price: number): Portfolio {
    // Copia del portafolio para no mutar el original
    const updatedPortfolio = { ...portfolio };
    
    // Buscar si ya tenemos esta acción en el portafolio
    const existingPosition = updatedPortfolio.positions.find(pos => pos.share.ticker === ticker);
    
    if (existingPosition) {
      // Si ya existe la posición, actualizamos
      const newQuantity = existingPosition.quantity + quantity;
      const newTotalInvested = existingPosition.totalInvested + (quantity * price);
      const newAveragePrice = newTotalInvested / newQuantity;
      
      existingPosition.quantity = newQuantity;
      existingPosition.averagePrice = newAveragePrice;
      existingPosition.totalInvested = newTotalInvested;
      existingPosition.currentValue = newQuantity * existingPosition.share.unitValue;
      existingPosition.share.quantity = newQuantity;
      existingPosition.share.totalValue = existingPosition.currentValue;
    } else {
      // Si no existe, creamos una nueva posición
      const mockShare: PortfolioShare = {
        id: `mock-${Date.now().toString()}`,
        companyName: this.getCompanyName(ticker),
        ticker,
        stockName: 'NASDAQ', // Por defecto
        stockMic: 'XNAS',    // Por defecto
        quantity,
        unitValue: price,    // Asumimos que el precio actual es el mismo que compramos
        totalValue: quantity * price,
        performance: 0,      // Sin rendimiento inicial
        color: this.getRandomColor()
      };
      
      const newPosition: PortfolioPosition = {
        id: `pos-${mockShare.id}`,
        share: mockShare,
        quantity,
        averagePrice: price,
        totalInvested: quantity * price,
        currentValue: quantity * price
      };
      
      updatedPortfolio.positions.push(newPosition);
    }
    
    // Actualizamos los totales del portafolio
    updatedPortfolio.balance -= quantity * price;
    updatedPortfolio.totalInvested = updatedPortfolio.positions.reduce(
      (sum, pos) => sum + pos.totalInvested, 0
    );
    updatedPortfolio.totalValue = updatedPortfolio.positions.reduce(
      (sum, pos) => sum + pos.currentValue, 0
    );
    updatedPortfolio.performance = ((updatedPortfolio.totalValue / updatedPortfolio.totalInvested) - 1) * 100;
    
    return updatedPortfolio;
  }
  
  /**
   * Simula la venta de una acción para modo de desarrollo
   */
  private simulateSell(portfolio: Portfolio, ticker: string, quantity: number, price: number): Portfolio {
    // Copia del portafolio para no mutar el original
    const updatedPortfolio = { ...portfolio };
    
    // Buscar la posición de la acción
    const position = updatedPortfolio.positions.find(pos => pos.share.ticker === ticker);
    
    if (!position) {
      console.error(`No se encontró la acción ${ticker} en el portafolio`);
      return portfolio;
    }
    
    if (position.quantity < quantity) {
      console.error(`No hay suficientes acciones de ${ticker} para vender`);
      return portfolio;
    }
    
    // Cantidad después de la venta
    const newQuantity = position.quantity - quantity;
    
    if (newQuantity === 0) {
      // Si vendimos todas las acciones, eliminamos la posición
      updatedPortfolio.positions = updatedPortfolio.positions.filter(pos => pos.share.ticker !== ticker);
    } else {
      // Actualizamos la posición
      position.quantity = newQuantity;
      position.currentValue = newQuantity * position.share.unitValue;
      // La cantidad invertida disminuye proporcionalmente
      position.totalInvested = (position.totalInvested / position.quantity) * newQuantity;
      
      // Actualizamos también el share asociado
      position.share.quantity = newQuantity;
      position.share.totalValue = position.currentValue;
    }
    
    // Actualizamos los totales del portafolio
    updatedPortfolio.balance += quantity * price;
    updatedPortfolio.totalInvested = updatedPortfolio.positions.reduce(
      (sum, pos) => sum + pos.totalInvested, 0
    );
    updatedPortfolio.totalValue = updatedPortfolio.positions.reduce(
      (sum, pos) => sum + pos.currentValue, 0
    );
    
    // Evitamos división por cero
    if (updatedPortfolio.totalInvested > 0) {
      updatedPortfolio.performance = ((updatedPortfolio.totalValue / updatedPortfolio.totalInvested) - 1) * 100;
    } else {
      updatedPortfolio.performance = 0;
    }
    
    return updatedPortfolio;
  }
  
  /**
   * Genera datos históricos de prueba para el portafolio
   */
  private generateMockHistory(days: number): Observable<any[]> {
    const history = [];
    const today = new Date();
    const startValue = 10000; // Valor inicial
    let currentValue = startValue;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Variación aleatoria entre -2% y +2%
      const variation = (Math.random() * 4 - 2) / 100;
      currentValue = currentValue * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        value: Math.round(currentValue * 100) / 100
      });
    }
    
    return of(history);
  }

  /**
   * Obtiene un color aleatorio para la visualización
   */
  private getRandomColor(): string {
    const colors = ['red', 'blue', 'green', 'purple', 'orange', 'teal', 'indigo', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Obtiene el nombre de la empresa basado en el ticker
   */
  private getCompanyName(ticker: string): string {
    const companies: {[key: string]: string} = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'BRK.B': 'Berkshire Hathaway Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'V': 'Visa Inc.',
      'JNJ': 'Johnson & Johnson',
      'BAC': 'Bank of America Corp.',
    };
    
    return companies[ticker] || `${ticker} Inc.`;
  }
  
  /**
   * Obtiene el ID del usuario actual
   */
  private getUserId(): string {
    // En una aplicación real, obtendrías esto del servicio de autenticación
    return 'current-user-id';
  }
}
