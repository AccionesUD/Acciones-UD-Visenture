import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
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
  
  // Contenido traducido para mensajes dinámicos
  private translations: { [lang: string]: { newsError: string; timeAgoMinutes: (mins: number) => string; timeAgoHours: (hours: number) => string; noSummary: string } } = {
    'es': {
      'newsError': 'No se pudieron cargar las noticias financieras.',
      'timeAgoMinutes': (mins: number) => `Hace ${mins} minutos`,
      'timeAgoHours': (hours: number) => `Hace ${hours} horas`,
      'noSummary': 'Sin resumen disponible.'
    },
    'en': {
      'newsError': 'Could not load financial news.',
      'timeAgoMinutes': (mins: number) => `${mins} minutes ago`,
      'timeAgoHours': (hours: number) => `${hours} hours ago`,
      'noSummary': 'No summary available.'
    },
    'fr': {
      'newsError': 'Impossible de charger les actualités financières.',
      'timeAgoMinutes': (mins: number) => `Il y a ${mins} minutes`,
      'timeAgoHours': (hours: number) => `Il y a ${hours} heures`,
      'noSummary': 'Pas de résumé disponible.'
    },
    'ru': {
      'newsError': 'Не удалось загрузить финансовые новости.',
      'timeAgoMinutes': (mins: number) => `${mins} минут назад`,
      'timeAgoHours': (hours: number) => `${hours} часов назад`,
      'noSummary': 'Сводка недоступна.'
    }
  };

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
  
  // Versiones traducidas de las noticias de respaldo
  private fallbackNewsTranslations: { [key: string]: FinancialNews[] } = {
    'en': [
      {
        title: 'Markets rise after monetary policy announcements',
        source: 'Financial Times',
        url: '#',
        date: 'May 28, 2025',
        summary: 'Major stock indices post significant gains following Fed announcements.',
        symbols: ['SPY', 'QQQ', 'DIA']
      },
      {
        title: 'New regulations for the financial sector in Europe',
        source: 'Bloomberg',
        url: '#',
        date: 'May 27, 2025',
        summary: 'The European Union announces a package of regulatory measures that will affect financial operations.',
        symbols: ['EZU', 'FEZ', 'EURL']
      },
      {
        title: 'Tech companies lead recovery on Wall Street',
        source: 'Reuters',
        url: '#',
        date: 'May 26, 2025',
        summary: 'Shares of major tech companies increased by an average of 3% this week.',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
      }
    ],
    'fr': [
      {
        title: 'Les marchés montent après les annonces de politique monétaire',
        source: 'Financial Times',
        url: '#',
        date: '28 mai 2025',
        summary: 'Les principaux indices boursiers enregistrent des gains significatifs suite aux annonces de la FED.',
        symbols: ['SPY', 'QQQ', 'DIA']
      },
      {
        title: 'Nouvelles réglementations pour le secteur financier en Europe',
        source: 'Bloomberg',
        url: '#',
        date: '27 mai 2025',
        summary: "L'Union européenne annonce un ensemble de mesures réglementaires qui affecteront les opérations financières.",
        symbols: ['EZU', 'FEZ', 'EURL']
      },
      {
        title: 'Les entreprises technologiques mènent la reprise à Wall Street',
        source: 'Reuters',
        url: '#',
        date: '26 mai 2025',
        summary: 'Les actions des principales entreprises technologiques ont augmenté en moyenne de 3% cette semaine.',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
      }
    ],
    'ru': [
      {
        title: 'Рынки растут после объявлений о денежно-кредитной политике',
        source: 'Financial Times',
        url: '#',
        date: '28 мая 2025 г.',
        summary: 'Основные фондовые индексы демонстрируют значительный рост после объявлений ФРС.',
        symbols: ['SPY', 'QQQ', 'DIA']
      },
      {
        title: 'Новые правила для финансового сектора в Европе',
        source: 'Bloomberg',
        url: '#',
        date: '27 мая 2025 г.',
        summary: 'Европейский союз анонсирует пакет нормативных мер, которые повлияют на финансовые операции.',
        symbols: ['EZU', 'FEZ', 'EURL']
      },
      {
        title: 'Технологические компании возглавляют восстановление на Уолл-стрит',
        source: 'Reuters',
        url: '#',
        date: '26 мая 2025 г.',
        summary: 'Акции крупнейших технологических компаний выросли в среднем на 3% за эту неделю.',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
      }
    ]
  };
  
  private currentLang = 'es';
  
  constructor(
    private newsService: NewsService,
    @Inject(LOCALE_ID) private localeId: string
  ) {
    // Extraer el idioma base del locale ID
    this.currentLang = this.localeId.split('-')[0];
    if (!['es', 'en', 'fr', 'ru'].includes(this.currentLang)) {
      this.currentLang = 'es'; // Default si no es un idioma soportado
    }
    
    // Aplicar traducciones a las noticias de respaldo según el idioma
    if (this.currentLang !== 'es' && this.fallbackNewsTranslations[this.currentLang]) {
      this.fallbackNews = this.fallbackNewsTranslations[this.currentLang];
    }
  }

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
        // Usar el mensaje de error traducido
        this.newsError = this.translations[this.currentLang]?.newsError || this.translations['es'].newsError;
        this.isLoadingNews = false;
      }
    });
  }

  formatNewsDate(dateString: string): string {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime())/60000);
    
    if (diffMins < 60) {
      return this.translations[this.currentLang]?.timeAgoMinutes(diffMins) || 
             this.translations['es'].timeAgoMinutes(diffMins);
    }
    
    if (diffMins < 1440) {
      return this.translations[this.currentLang]?.timeAgoHours(Math.floor(diffMins/60)) || 
             this.translations['es'].timeAgoHours(Math.floor(diffMins/60));
    }
    
    // Formato de fecha dependiendo del idioma
    const dateFormatOptions = { day: 'numeric' as const, month: 'short' as const, year: 'numeric' as const };
    try {
      return date.toLocaleDateString(this.localeId, dateFormatOptions);
    } catch (e) {
      return date.toLocaleDateString('es-ES', dateFormatOptions);
    }
  }
  
  // Método para obtener el mensaje de "Sin resumen disponible" traducido
  getNoSummaryText(): string {
    return this.translations[this.currentLang]?.noSummary || this.translations['es'].noSummary;
  }
}
