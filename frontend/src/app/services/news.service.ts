import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlpacaDataService } from './alpaca-data.service';
import { AlpacaNews, GetNewsParams, FinancialNews } from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  constructor(private alpacaService: AlpacaDataService) { }

  /**
   * Obtiene las últimas noticias financieras
   * @param symbols Símbolos específicos para filtrar (opcional)
   * @param limit Cantidad máxima de noticias a devolver
   */
  getLatestNews(symbols?: string[], limit: number = 5): Observable<AlpacaNews[]> {
    const params: GetNewsParams = {
      limit,
      sort: 'DESC' // Más recientes primero
    };

    if (symbols && symbols.length > 0) {
      params.symbols = symbols;
    }

    // Obtenemos las fechas para los últimos 3 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 3);

    params.start = startDate.toISOString().split('T')[0];
    params.end = endDate.toISOString().split('T')[0];

    return this.alpacaService.getNews(params).pipe(
      catchError(error => {
        console.error('Error al obtener noticias:', error);
        return this.getFallbackNews(symbols, limit);
      })
    );
  }

  /**
   * Obtiene noticias específicas para una acción
   * @param symbol Símbolo de la acción
   * @param limit Cantidad máxima de noticias a devolver
   */
  getNewsForSymbol(symbol: string, limit: number = 5): Observable<AlpacaNews[]> {
    return this.getLatestNews([symbol], limit);
  }

  /**
   * Noticias de respaldo en caso de error en la API
   */
  private getFallbackNews(symbols?: string[], limit: number = 5): Observable<AlpacaNews[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const fallbackNews: AlpacaNews[] = [
      {
        ID: 1001,
        Headline: 'Los mercados globales muestran signos de recuperación',
        Author: 'Ana Martínez',
        CreatedAt: yesterday.toISOString(),
        UpdatedAt: yesterday.toISOString(),
        Summary: 'Los principales índices bursátiles muestran una tendencia alcista tras las recientes medidas económicas.',
        URL: 'https://example.com/news/recovery',
        Images: ['https://placehold.co/600x400?text=Markets+Recovery'],
        Symbols: ['SPY', 'QQQ'],
        Source: 'finanzas-hoy'
      },
      {
        ID: 1002,
        Headline: 'Apple anuncia nuevos productos para el próximo trimestre',
        Author: 'Carlos Rodríguez',
        CreatedAt: today.toISOString(),
        UpdatedAt: today.toISOString(),
        Summary: 'La compañía tecnológica sorprende con innovaciones en su línea de productos principales.',
        URL: 'https://example.com/news/apple-products',
        Images: ['https://placehold.co/600x400?text=Apple+Products'],
        Symbols: ['AAPL'],
        Source: 'tech-news'
      },
      {
        ID: 1003,
        Headline: 'Tesla supera expectativas de ventas en el último trimestre',
        Author: 'Laura González',
        CreatedAt: today.toISOString(),
        UpdatedAt: today.toISOString(),
        Summary: 'El fabricante de vehículos eléctricos reporta un crecimiento sostenido a pesar de los desafíos en la cadena de suministro.',
        URL: 'https://example.com/news/tesla-sales',
        Images: ['https://placehold.co/600x400?text=Tesla+Sales'],
        Symbols: ['TSLA'],
        Source: 'auto-market'
      },
      {
        ID: 1004,
        Headline: 'Amazon expande operaciones en Latinoamérica',
        Author: 'Roberto Sánchez',
        CreatedAt: yesterday.toISOString(),
        UpdatedAt: yesterday.toISOString(),
        Summary: 'El gigante del comercio electrónico anuncia importantes inversiones en centros de distribución en la región.',
        URL: 'https://example.com/news/amazon-latam',
        Images: ['https://placehold.co/600x400?text=Amazon+LatAm'],
        Symbols: ['AMZN'],
        Source: 'business-weekly'
      },
      {
        ID: 1005,
        Headline: 'Microsoft aumenta dividendos en un 10%',
        Author: 'Elena Torres',
        CreatedAt: yesterday.toISOString(),
        UpdatedAt: yesterday.toISOString(),
        Summary: 'La junta directiva aprueba un incremento en los pagos a accionistas tras resultados financieros positivos.',
        URL: 'https://example.com/news/microsoft-dividend',
        Images: ['https://placehold.co/600x400?text=Microsoft+Dividend'],
        Symbols: ['MSFT'],
        Source: 'invest-today'
      }
    ];

    // Filtramos por símbolos si se especificaron
    let filteredNews = fallbackNews;
    if (symbols && symbols.length > 0) {
      filteredNews = fallbackNews.filter(news => 
        news.Symbols.some(sym => symbols.includes(sym))
      );
    }

    // Limitamos la cantidad de noticias
    return of(filteredNews.slice(0, limit));
  }
}
