import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Share, CreateShareDto } from '../models/share.model';

@Injectable({
  providedIn: 'root'
})
export class SharesService {
  private apiUrl = `${environment.apiUrl}/shares`;

  constructor(private http: HttpClient) { }
  /**
   * Obtiene todas las acciones disponibles (sin cache)
   */
  getAllShares(): Observable<Share[]> {
    console.log('[SharesService] Solicitando todas las acciones desde API:', this.apiUrl);
    return this.http.get<Share[]>(this.apiUrl).pipe(
      map(shares => {
        console.log(`[SharesService] Recibidas ${shares.length} acciones del backend`);
        if (shares.length > 0) {
          console.log('[SharesService] Ejemplo de primera acción recibida:', shares[0]);
        }
        return shares;
      }),
      catchError(error => {
        console.error('[SharesService] Error al obtener acciones:', error);
        return throwError(() => new Error('Error al obtener acciones'));
      })
    );
  }
  /**
   * Busca una acción por su símbolo filtrando el listado completo
   */
  getShareBySymbol(symbol: string): Observable<Share> {
    console.log(`[SharesService] Buscando acción por símbolo: ${symbol}`);
    return this.getAllShares().pipe(
      map(shares => {
        console.log(`[SharesService] Filtrando ${shares.length} acciones para buscar ${symbol}`);
        const found = shares.find(s => s.ticker === symbol);
        if (!found) {
          console.warn(`[SharesService] No se encontró acción con símbolo: ${symbol}`);
          throw new Error(`No se encontró la acción con símbolo: ${symbol}`);
        }
        console.log(`[SharesService] Acción encontrada:`, found);
        return found;
      }),
      catchError(error => {
        console.error(`[SharesService] Error al buscar acción ${symbol}:`, error);
        return throwError(() => new Error(`Error al buscar acción ${symbol}`));
      })
    );
  }
  /**
   * Obtiene acciones por mercado utilizando el campo stock.mic
   */
  getSharesByMarket(stockMic: string): Observable<Share[]> {
    console.log(`[SharesService] Filtrando acciones para mercado con MIC: ${stockMic}`);
    return this.getAllShares().pipe(
      map(shares => {
        console.log(`[SharesService] Total acciones recibidas: ${shares.length}`);
        
        // Filtrar por el campo stock.mic de cada acción
        const filtered = shares.filter(s => s.stock?.mic === stockMic);
        console.log(`[SharesService] Acciones encontradas para ${stockMic}: ${filtered.length}`);
        
        // Mostrar ejemplo para validación
        if (filtered.length > 0) {
          console.log('[SharesService] Ejemplo de acción filtrada:', filtered[0]);
        }
        return filtered;
      }),
      catchError(error => {
        console.error(`[SharesService] Error al filtrar acciones para mercado ${stockMic}:`, error);
        return throwError(() => new Error(`Error al obtener acciones para mercado ${stockMic}`));
      })
    );
  }

  /**
   * Registra una nueva acción usando solo el símbolo
   */
  createShare(shareData: CreateShareDto): Observable<Share> {
    return this.http.post<Share>(`${this.apiUrl}/new`, { symbol: shareData.symbol }).pipe(
      catchError(error => {
        console.error('Error al registrar acción:', error);
        return throwError(() => new Error('Error al registrar acción'));
      })
    );
  }
}