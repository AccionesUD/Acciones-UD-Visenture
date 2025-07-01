import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los usuarios con sus roles.
   * Requiere rol de 'admin'.
   */
  getUsersWithRoles(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/accounts`).pipe(
      catchError(this.handleError<User[]>('getUsersWithRoles', []))
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Muestra el error por consola pero permite que la aplicación siga funcionando
      return of(result as T);
    };
  }
}