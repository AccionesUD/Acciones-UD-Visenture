import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FinancialNews {
  title: string;
  source: string;
  url: string;
  imageUrl?: string;
  date: string;
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {

  private newsApiKey: string;
  private newsApiUrl = 'https://newsapi.org/v2';
  
  // Bandera para determinar si usamos datos reales o simulados
  private useRealApis = false;
  
  // Implementación de caché
  private newsCache: {
    timestamp: number;
    data: FinancialNews[];
    params: {
      count: number;
      language: string;
      category: string;
    }
  } | null = null;
  
  // Tiempo de expiración de la caché en milisegundos (24 horas)
  private cacheDuration = 24 * 60 * 60 * 1000;
  
  private simulatedNews: FinancialNews[] = [
    {
      title: 'El mercado alcanza nuevos máximos históricos',
      source: 'Market News',
      url: 'https://www.marketnews.com/mercados-maximos',
      date: '28 May, 2025',
      summary: 'Los principales índices bursátiles establecen nuevos récords impulsados por resultados corporativos mejores de lo esperado.',
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      title: 'La Fed mantiene las tasas de interés sin cambios',
      source: 'Financial Times',
      url: 'https://www.ft.com/tasas-interes',
      date: '27 May, 2025',
      summary: 'La Reserva Federal decidió mantener las tasas de interés en su reunión de mayo, citando estabilidad inflacionaria.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    },
    {
      title: 'El sector tecnológico lidera el repunte del mercado',
      source: 'Tech Invest',
      url: 'https://techinvest.com/sector-tech-repunte',
      date: '26 May, 2025',
      summary: 'Las acciones tecnológicas experimentan un fuerte impulso tras anuncios de nuevos productos e innovaciones en IA.',
      imageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'
    }
  ];

  constructor(private http: HttpClient) {
    try {
      this.newsApiKey = environment.newsApiKey || 'demo';
    } catch (e) {
      console.warn('Usando claves API de demostración. Las llamadas reales a APIs no funcionarán.');
      this.newsApiKey = 'demo';
      this.useRealApis = false;
    }
  }

  getFinancialNews(count: number = 3, language: string = 'es', category: string = 'business'): Observable<FinancialNews[]> {
    // Verificar si tenemos datos en caché y si son válidos
    if (this.isCacheValid(count, language, category)) {
      console.log('Usando datos en caché para noticias financieras');
      return of(this.newsCache!.data);
    }
    
    if (this.useRealApis) {
      return this.getFinancialNewsFromApi(count, language, category).pipe(
        tap(news => {
          // Guardar en caché
          this.updateCache(news, count, language, category);
        })
      );
    }
    
    // Simulación para desarrollo cuando no hay API keys válidas
    return of(this.simulatedNews).pipe(
      delay(600), // Simula un retraso de red
      tap(news => {
        // Guardar también las simuladas en caché
        this.updateCache(news, count, language, category);
      }),
      catchError(this.handleError)
    );
  }
  
  private isCacheValid(count: number, language: string, category: string): boolean {
    if (!this.newsCache) return false;
    
    const isExpired = Date.now() - this.newsCache.timestamp > this.cacheDuration;
    if (isExpired) return false;
    
    const params = this.newsCache.params;
    return params.count === count && 
           params.language === language && 
           params.category === category;
  }

  private updateCache(data: FinancialNews[], count: number, language: string, category: string): void {
    this.newsCache = {
      timestamp: Date.now(),
      data,
      params: { count, language, category }
    };
  }

  private getFinancialNewsFromApi(count: number, language: string, category: string): Observable<FinancialNews[]> {
    return this.http.get(
      `${this.newsApiUrl}/top-headlines?category=${category}&language=${language}&pageSize=${count}&apiKey=${this.newsApiKey}`
    ).pipe(
      map(this.processNewsResponse.bind(this)),
      catchError(err => {
        console.error('Error al obtener noticias desde la API:', err);
        return of(this.simulatedNews); 
      })
    );
  }

  private processNewsResponse(response: any): FinancialNews[] {
    if (!response.articles || !Array.isArray(response.articles)) {
      return [];
    }
    
    return response.articles.map((article: any) => ({
      title: article.title,
      source: article.source?.name || 'Fuente desconocida',
      url: article.url || '#', 
      imageUrl: article.urlToImage || this.getDefaultImageForFinancialNews(),
      date: new Date(article.publishedAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      summary: article.description || 'No hay descripción disponible'
    }));
  }
  

  private getDefaultImageForFinancialNews(): string {
    const defaultImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f'
    ];
    
    // Seleccionar aleatoriamente una imagen
    const randomIndex = Math.floor(Math.random() * defaultImages.length);
    return defaultImages[randomIndex];
  }

  public clearNewsCache(): void {
    this.newsCache = null;
    console.log('Caché de noticias financieras eliminada');
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en FinancialDataService:', error);
    return throwError(() => new Error(error.message || 'Error al obtener datos financieros'));
  }
}
