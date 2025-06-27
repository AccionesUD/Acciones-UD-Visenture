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

  submitBuyOrder(order: BuyOrder): Observable<any> {
    // El modelo ya está alineado con el backend, solo enviar el objeto tal cual
    return this.http.post<any>('http://localhost:3000/api/orders', order);
  }
}