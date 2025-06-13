import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NewsService } from '../services/news.service';
import { AlpacaNews, FinancialNews } from '../models/news.model';

@Component({
  selector: 'app-home',  
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  isLoadingNews = true;
  newsError: string | null = null;
  news: AlpacaNews[] = [];

  // Noticias de respaldo en caso de que falle la API
  fallbackNews: FinancialNews[] = [
    {
      title: 'Mercados al alza tras anuncios de política monetaria',
      source: 'Financial Times',
      url: '#',
      date: '28 May, 2025',
      summary: 'Los principales índices bursátiles registran ganancias significativas tras los anuncios de la FED.',
      symbols: ['SPY', 'QQQ', 'DIA']
    },
    {
      title: 'Nuevas regulaciones para el sector financiero en Europa',
      source: 'Bloomberg',
      url: '#',
      date: '27 May, 2025',
      summary: 'La Unión Europea anuncia un paquete de medidas regulatorias que afectarán a las operaciones financieras.',
      symbols: ['EZU', 'FEZ', 'EURL']
    },
    {
      title: 'Tecnológicas lideran recuperación en Wall Street',
      source: 'Reuters',
      url: '#',
      date: '26 May, 2025',
      summary: 'Las acciones de las principales empresas tecnológicas aumentaron un promedio de 3% esta semana.',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
    }
  ];
  
  constructor(
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.loadFinancialNews();
  }

  loadFinancialNews(): void {
    this.isLoadingNews = true;
    this.newsError = null;
    const topSymbols = ['AAPL','MSFT','GOOGL','AMZN','TSLA'];
    this.newsService.getLatestNews(topSymbols, 6).subscribe({
      next: news => {
        this.news = news;
        this.isLoadingNews = false;
      },
      error: () => {
        this.newsError = 'No se pudieron cargar las noticias financieras.';
        this.isLoadingNews = false;
      }
    });
  }

  formatNewsDate(dateString: string): string {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime())/60000);
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins/60)} horas`;
    return date.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  }
}
