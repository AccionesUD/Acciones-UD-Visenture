import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BuyOrder, BuyResponse } from '../models/buy.model';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BuysService {
  constructor(private http: HttpClient) {}

  checkFundsAvailability(amount: number): Observable<boolean> {
    // En una aplicación real, esto haría una llamada HTTP para verificar el saldo
    // Simulamos una respuesta exitosa si el monto es menor a 10 millones
    return of(amount <= 10000000).pipe(delay(500));
  }

  submitBuyOrder(order: BuyOrder): Observable<BuyResponse> {
    // En una aplicación real, esto enviaría la orden al servidor
    // Simulamos una respuesta exitosa con un retraso
    const response: BuyResponse = {
      success: true,
      status: order.orderType === 'market' ? 'completed' : 'pending',
      orderId: `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      filledQuantity: order.orderType === 'market' ? order.quantity : undefined,
      boughtAt: order.price,
      totalAmount: order.quantity * (order.price || 0),
      fee: order.quantity * (order.price || 0) * 0.005,
      submittedAt: new Date(),
      filledAt: order.orderType === 'market' ? new Date() : undefined
    };

    return of(response).pipe(delay(1000));
  }
}