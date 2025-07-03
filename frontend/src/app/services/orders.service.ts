import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Import map operator
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
    // Fetch the last 3 orders, similar to historical but with a limit
    return this.http.get<Order[]>(`${this.apiUrl}/accounts/orders?limit=3`).pipe(
      // Sort by creation date in descending order to get the most recent ones
      map((orders: Order[]) => orders.sort((a: Order, b: Order) => new Date(b.create_at).getTime() - new Date(a.create_at).getTime()))
    );
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
