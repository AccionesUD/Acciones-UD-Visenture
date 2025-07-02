import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';
import { BuyOrder } from '../models/buy.model';
import { SellOrder } from '../models/sell.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRecentOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  submitBuyOrder(order: BuyOrder): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, { ...order, side: 'buy' });
  }

  submitSellOrder(order: SellOrder): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, { ...order, side: 'sell' });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/orders/${orderId}`);
  }
}
