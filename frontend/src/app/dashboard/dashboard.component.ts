import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, NgApexchartsModule } from 'ng-apexcharts';
import { MockChartDataService } from '../services/mock-data-chart.service';
import { AlpacaDataService } from '../services/alpaca-data.service';
import { SharesService } from '../services/shares.service';
import { StocksService } from '../services/stocks.service';
import { Stock } from '../models/stock.model';
import { Share } from '../models/share.model';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    NgApexchartsModule, 
    MatProgressSpinnerModule, 
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  providers: [MockChartDataService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public chartOptions: Partial<ChartOptions>={};
  public isLoading = true;
  public isLoadingWatchlist = true;
  public isLoadingTransactions = true;
  public useMockData = false;
  public currentSymbol = 'AAPL';
  public transactions: any[] = [];
  private destroy$ = new Subject<void>();

  public watchlistShares: any[] = [];
  public availableStocks: Stock[] = []; // Mercados disponibles
  public availableShares: Share[] = []; // Acciones disponibles

  constructor(
    private http: HttpClient,
    private mockService: MockChartDataService,
    private alpacaService: AlpacaDataService,
    private sharesService: SharesService,
    private stocksService: StocksService
  ) {
    this.initializeChart();
  }

  ngOnInit(): void {
    this.loadData();
    
    // Actualizamos los datos cada 2 minutos
    interval(120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshData());
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.isLoadingWatchlist = true;
    this.isLoadingTransactions = true;
    
    // Cargar mercados (stocks)
    this.stocksService.getStocks().subscribe({
      next: (stocks) => {
        this.availableStocks = stocks;
        console.log('Mercados cargados en dashboard:', stocks.length);
      },
      error: (err) => console.error('Error al cargar mercados en dashboard:', err)
    });
    
    // Cargar watchlist (acciones favoritas o destacadas)
    this.loadWatchlistShares();
    
    // Cargar datos del gráfico para la acción actual
    this.loadChartData(this.currentSymbol);
    
    // Cargar transacciones recientes
    this.loadTransactions();
  }
  
  refreshData(): void {
    console.log('Actualizando datos del dashboard...');
    
    // Actualizar solo datos dinámicos
    this.loadChartData(this.currentSymbol);
    this.loadWatchlistShares();
  }
  
  loadWatchlistShares(): void {
    this.isLoadingWatchlist = true;
    
    // En una implementación real, obtendríamos esto de un servicio de watchlist
    // Por ahora, vamos a cargar algunas acciones populares
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    // Simulamos una carga de datos
    setTimeout(() => {
      this.watchlistShares = popularSymbols.map(symbol => ({
        symbol,
        name: this.getCompanyName(symbol),
        price: Math.random() * 1000 + 50, // Precio aleatorio entre 50 y 1050
        change: (Math.random() * 10 - 5).toFixed(2), // Cambio entre -5% y +5%
        isPositive: Math.random() > 0.5 // 50% positivo, 50% negativo
      }));
      this.isLoadingWatchlist = false;
    }, 1000);
  }
  
  loadChartData(symbol: string): void {
    this.isLoading = true;
    this.currentSymbol = symbol;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // Datos de la última semana
    
    if (this.useMockData) {
      // Usar datos simulados si estamos en modo prueba
      this.mockService.getStockData(symbol).subscribe(data => {
        this.updateChartWithData(data, symbol);
        this.isLoading = false;
      });
    } else {
      // Usar Alpaca API para datos reales
      this.alpacaService.getShareBars(symbol, startDate, endDate).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.updateChartWithData(data, symbol);
          } else {
            console.warn(`No hay datos para ${symbol}, usando datos simulados`);
            this.useMockData = true;
            this.loadChartData(symbol); // Recargar con datos simulados
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar datos del gráfico:', error);
          this.useMockData = true;
          this.loadChartData(symbol); // Recargar con datos simulados
          this.isLoading = false;
        }
      });
    }
  }
  
  updateChartWithData(data: any[], symbol: string): void {
    this.chartOptions = {
      series: [{
        name: symbol,
        data: data
      }],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: true
        },
        toolbar: {
          show: true
        },
        animations: {
          enabled: true
        },
      },
      title: {
        text: `Precio de ${symbol} - ${this.getCompanyName(symbol)}`
      },
      xaxis: {
        type: 'datetime'
      }
    };
  }
  
  loadTransactions(): void {
    this.isLoadingTransactions = true;
    
    // En una implementación real, obtendríamos esto de un servicio de transacciones
    // Por ahora, simulamos transacciones
    setTimeout(() => {
      this.transactions = [
        {
          id: 'TX123456',
          type: 'buy',
          symbol: 'AAPL',
          shares: 5,
          price: 178.42,
          total: 892.10,
          date: new Date(Date.now() - 86400000) // Ayer
        },
        {
          id: 'TX123457',
          type: 'sell',
          symbol: 'MSFT',
          shares: 2,
          price: 336.21,
          total: 672.42,
          date: new Date(Date.now() - 172800000) // Hace 2 días
        },
        {
          id: 'TX123458',
          type: 'buy',
          symbol: 'GOOGL',
          shares: 1,
          price: 125.86,
          total: 125.86,
          date: new Date(Date.now() - 259200000) // Hace 3 días
        }
      ];
      this.isLoadingTransactions = false;
    }, 1200);
  }
  

  
  changeSymbol(symbol: string): void {
    if (symbol !== this.currentSymbol) {
      this.loadChartData(symbol);
    }
  }
  
  getStatusClass(value: number): string {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
  

  
  getCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'BRK.B': 'Berkshire Hathaway Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'JNJ': 'Johnson & Johnson'
    };
    
    return companies[symbol] || 'Desconocida';
  }
  
  private initializeChart(): void {
    this.chartOptions = {
      series: [{
        name: "Loading...",
        data: []
      }],
      chart: {
        height: 350,
        type: "line"
      },
      title: {
        text: "Cargando datos..."
      },
      xaxis: {
        type: 'datetime'
      }
    };
  }
}
