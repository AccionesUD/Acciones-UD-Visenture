import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Stock } from '../models/portfolio.model';
import { SellOrder, SellResponse } from '../models/sell.model';
import { environment } from '../../environments/environment';
import { PortfolioService } from './portfolio.service';

@Injectable({
  providedIn: 'root'
})
export class SellsService {
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private portfolioService: PortfolioService
  ) { }
  
  checkStockAvailability(stockSymbol: string, quantity: number): Observable<boolean> {
    // En producción, esto se haría con una llamada al backend
    // return this.http.get<boolean>(`${this.apiUrl}/portfolio/stocks/${stockSymbol}/check?quantity=${quantity}`)
    
    // Versión mock para desarrollo
    return this.portfolioService.getPortfolioStocks().pipe(
      map(stocks => {
        const stock = stocks.find(s => s.symbol === stockSymbol);
        return stock ? stock.quantity >= quantity : false;
      }),
      catchError(this.handleError<boolean>('checkStockAvailability', false))
    );
  }

  submitSellOrder(order: SellOrder): Observable<SellResponse> {
    // En producción: 
    // return this.http.post<SellResponse>(`${this.apiUrl}/orders/sell`, order)
    
    // Primero verificamos si hay suficiente stock antes de procesar la orden
    return this.checkStockAvailability(order.stockSymbol || order.stockId, order.quantity).pipe(
      switchMap(isAvailable => {
        if (!isAvailable) {
          return of<SellResponse>({
            success: false,
            status: 'canceled',
            message: `No dispone de suficientes acciones para vender ${order.quantity} unidades de ${order.stockSymbol || order.stockId}`
          });
        }
        
        // Versión mock para desarrollo
        const price = order.price || 100; // Si no se especifica un precio, usamos 100 como ejemplo
        const now = new Date();
        
        // Si es orden de mercado, se completa inmediatamente
        const isMarketOrder = order.orderType === 'market';
        
        const totalAmount = price * order.quantity;
        const fee = totalAmount * 0.005; // 0.5% de comisión
        const netAmount = totalAmount - fee; // Monto neto después de comisiones
        
        const response: SellResponse = {
          success: true,
          orderId: 'sell-' + Math.floor(Math.random() * 1000000),
          status: isMarketOrder ? 'completed' : 'pending',
          message: isMarketOrder ? 'Orden de venta ejecutada con éxito' : 'Orden de venta recibida y pendiente de ejecución',
          soldAt: price,
          totalAmount: totalAmount,
          fee: fee,
          submittedAt: now,
          filledAt: isMarketOrder ? now : undefined,
          filledQuantity: isMarketOrder ? order.quantity : 0,
          timestamp: now // Para compatibilidad
        };
          // Si la orden fue completada, actualizamos el portfolio y el saldo
        if (isMarketOrder) {
          // Actualizamos el portfolio reduciendo las acciones vendidas
          this.portfolioService.updatePortfolioAfterSell(order.stockId, order.quantity);
          
          // Actualizamos el saldo del usuario añadiendo el monto neto de la venta
          return this.portfolioService.updateUserBalance(netAmount).pipe(
            map(() => response)
          );
        }
        
        return of<SellResponse>(response);
      }),
      tap(response => {
        if (response.success) {
          console.log(`Orden de venta simulada para ${order.quantity} acciones ${order.stockSymbol || order.stockId}`);
        } else {
          console.warn(`Orden de venta rechazada: ${response.message}`);
        }
      }),
      catchError(this.handleError<SellResponse>('submitSellOrder'))
    );
  }
  

  getAvailableStocksForSelling(): Observable<Stock[]> {
    // En producción, esto se haría con una llamada al backend
    // return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/sellable-stocks`)
    
    // Versión mock para desarrollo - usamos todas las acciones del portfolio
    return this.portfolioService.getPortfolioStocks().pipe(
      tap(stocks => console.log('Acciones disponibles para venta:', stocks)),
      catchError(this.handleError<Stock[]>('getAvailableStocksForSelling', []))
    );
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} falló:`, error);
      // Loguear a un sistema de reporte de errores
      console.log(`${operation} error: ${error.message}`);
      
      // Devolvemos un resultado para que la app siga funcionando
      return of(result as T);
    };
  }
}