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
    
    // Primero inicializamos los mercados y luego cargamos los datos
    this.stocksService.getStocks().subscribe({
      next: (stocks) => {
        this.availableStocks = stocks;
        console.log('Mercados cargados en dashboard:', stocks.length);
        
        // Una vez que los mercados están cargados, podemos cargar las acciones
        if (stocks.length > 0) {
          this.loadWatchlistShares();
        }
      },
      error: (err) => {
        console.error('Error al cargar mercados en dashboard:', err);
        // Intentamos cargar watchlist de todas formas
        this.loadWatchlistShares();
      }
    });
    
    // Cargar datos del gráfico para la acción actual (independiente de los mercados)
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
    
    // Si tenemos mercados cargados, obtenemos acciones del mercado XNAS (NASDAQ)
    if (this.availableStocks.length > 0) {
      const nasdaqStock = this.availableStocks.find(stock => stock.mic === 'XNAS');
      if (nasdaqStock) {
        this.sharesService.getSharesByMarket(nasdaqStock.mic).subscribe({
          next: (shares) => {
            console.log(`Obtenidas ${shares.length} acciones para el dashboard`);
            
            // Tomamos hasta 5 acciones para el watchlist
            const watchlistData = shares.slice(0, 5).map(share => ({
              symbol: share.ticker,
              name: share.name_share,
              price: Math.random() * 1000 + 50, // Simular precio actual
              change: (Math.random() * 10 - 5).toFixed(2), // Simular cambio
              isPositive: Math.random() > 0.5 // Simular dirección
            }));
            
            this.watchlistShares = watchlistData;
            this.isLoadingWatchlist = false;
          },
          error: (err) => {
            console.error('Error al obtener acciones para el dashboard:', err);
            this.loadFallbackWatchlist();
          }
        });
        return;
      }
    }
    
    // Si no podemos obtener acciones del servicio, cargamos datos predefinidos
    this.loadFallbackWatchlist();
  }
  
  /**
   * Carga datos de watchlist predefinidos en caso de error
   */
  loadFallbackWatchlist(): void {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    this.watchlistShares = popularSymbols.map(symbol => ({
      symbol,
      name: this.getCompanyName(symbol),
      price: Math.random() * 1000 + 50, // Precio aleatorio entre 50 y 1050
      change: (Math.random() * 10 - 5).toFixed(2), // Cambio entre -5% y +5%
      isPositive: Math.random() > 0.5 // 50% positivo, 50% negativo
    }));
    
    this.isLoadingWatchlist = false;
  }
  
  loadChartData(symbol: string): void {
    this.isLoading = true;
    this.currentSymbol = symbol;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // Datos de la última semana
    
    if (this.useMockData) {
      // Usar datos simulados
      const mockData = this.mockService.getMockData(symbol);
      this.updateChartWithData(mockData, symbol);
    } else {
      // Usar datos reales de Alpaca
      this.alpacaService.getShareBars(symbol, startDate, endDate, '1D')
        .subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.updateChartWithData(data, symbol);
            } else {
              console.warn(`No hay datos disponibles para ${symbol}, usando datos simulados`);
              const mockData = this.mockService.getMockData(symbol);
              this.updateChartWithData(mockData, symbol);
            }
          },
          error: (error) => {
            console.error(`Error al obtener datos para ${symbol}:`, error);
            // En caso de error, usamos datos simulados
            const mockData = this.mockService.getMockData(symbol);
            this.updateChartWithData(mockData, symbol);
          }
        });
    }
  }
  
  // Este método se utiliza para cambiar el símbolo de la acción en el gráfico
  changeSymbol(symbol: string): void {
    if (symbol !== this.currentSymbol) {
      console.log(`Cambiando símbolo a: ${symbol}`);
      this.loadChartData(symbol);
    }
  }
  
  updateChartWithData(data: any[], symbol: string): void {
    this.chartOptions = {
      series: [{
        name: symbol,
        data: data
      }],
      chart: {
        type: 'line',
        height: 350,
        animations: {
          enabled: true
        },
        toolbar: {
          show: false
        }
      },
      title: {
        text: `${symbol} - Evolución de Precio`,
        align: 'left'
      },
      xaxis: {
        type: 'datetime'
      }
    };
    
    this.isLoading = false;
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    
    // Simulamos una carga de datos de transacciones
    setTimeout(() => {
      this.transactions = [
        { 
          id: 'TX100523', 
          type: 'buy', 
          symbol: 'AAPL',
          shares: 10,
          price: 185.92,
          total: 1859.20,
          date: '2025-06-10'
        },
        { 
          id: 'TX100524', 
          type: 'sell', 
          symbol: 'MSFT',
          shares: 5,
          price: 337.50,
          total: 1687.50,
          date: '2025-06-09'
        },
        { 
          id: 'TX100525', 
          type: 'buy', 
          symbol: 'GOOGL',
          shares: 3,
          price: 131.86,
          total: 395.58,
          date: '2025-06-08'
        }
      ];
      this.isLoadingTransactions = false;
    }, 1200);
  }
  
  initializeChart(): void {
    this.chartOptions = {
      series: [{
        name: "Cargando...",
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
  
  getStatusClass(value: number): string {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
}
