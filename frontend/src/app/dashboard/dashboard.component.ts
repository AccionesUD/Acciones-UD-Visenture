import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, NgApexchartsModule } from 'ng-apexcharts';
import { MockChartDataService } from '../services/mock-data-chart.service';
import { AlpacaDataService } from '../services/alpaca-data.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,NgApexchartsModule],
  providers: [MockChartDataService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public chartOptions: Partial<ChartOptions>={};
  public isLoading = true;
  public useMockData = true;
  public currentSymbol = 'AAPL';
  public transactions: any[] = [];

  public watchlistStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 180.95, change: 2.45 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 340.27, change: 1.02 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 198.73, change: -0.83 },
      { symbol: 'AMZN', name: 'Amazon.com', price: 145.68, change: 0.75 }
  ];

  constructor(
    private http: HttpClient,
    private mockService: MockChartDataService,
    private alpacaService: AlpacaDataService
  ) {}

  ngOnInit(): void {
    this.loadWatchlist();
    this.loadTransactions();
    this.loadChartData(this.currentSymbol);
  }

  toggleDataMode(): void {
    this.useMockData = !this.useMockData;
    this.loadChartData(this.currentSymbol);
  }

   loadMarkets(): void {
    this.alpacaService.getMarkets().subscribe({
      next: (markets) => {
        this.watchlistStocks = markets.map((market: any) => ({
          symbol: market.symbol,
          name: market.name,
          price: market.price || 0,
          change: 0 // Puedes calcular el cambio si tienes datos históricos
        }));
      },
      error: (err) => {
        console.error('Error loading markets:', err);
        // Cargar datos de respaldo si falla
        
      }
    });
  }


  loadChartData(symbol: string): void {
    this.isLoading = true;
    this.currentSymbol = symbol;

    if (this.useMockData) {
      setTimeout(() => {
        const data = this.mockService.getMockData(symbol);
        this.updateChart(data);
        this.isLoading = false;
      }, 1000);
    } else {
      const end = new Date();
      const start = new Date(end.getTime() - 7); // últimos 7 dias

      this.alpacaService.getStockBars(symbol, start, end, '15Min').subscribe({
        next: (data) => {
          if (data.length > 0) {
          this.updateChart(data);
        } else {
          this.showNoDataState(symbol);
        }
        this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al obtener datos reales:', err);
          this.showErrorState(symbol, err);
        }
      });
    }
    
  }
  private showNoDataState(symbol: string): void {
  this.chartOptions = {
    title: { text: `${symbol} - No hay datos disponibles` },
    series: [{
      name: 'Sin datos',
      data: []
    }],
    chart: { type: 'line', height: 400 },
    xaxis: { type: 'datetime' }
  };
  }

  testMarketScenario(type: string): void {
    this.isLoading = true;
    setTimeout(() => {
      const data = this.mockService.getScenarioData(type);
      this.updateChart(data);
      this.isLoading = false;
    }, 1000);
  }

  updateChart(data: { x: string; y: number }[]): void {
    this.chartOptions = {
      series: [{
        name: this.currentSymbol,
        data: data as any // Cast to 'any' to satisfy ApexAxisChartSeries type
      }],
      chart: {
        type: 'line',
        height: 400
      },
      title: {
        text: `Movimiento de ${this.currentSymbol} (${this.useMockData ? 'Simulado' : 'Real'})`
      },
      xaxis: {
        type: 'datetime'
      }
    };
  }

  private showErrorState(symbol: string, error: any): void {
    this.chartOptions = {
      title: { text: `${symbol} - Error al cargar datos` },
      series: [{
        name: 'Error',
        data: [] as any // Cast to 'any' to satisfy ApexAxisChartSeries type
      }],
      chart: {
        type: 'line',
        height: 400
      },
      xaxis: { type: 'datetime' }
    };
    this.isLoading = false;
  }

  private loadWatchlist(): void {
    this.watchlistStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 180.95, change: 2.45 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 340.27, change: 1.02 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 198.73, change: -0.83 },
      { symbol: 'AMZN', name: 'Amazon.com', price: 145.68, change: 0.75 }
    ];
  }

  private loadTransactions(): void {
    this.transactions = [
      { symbol: 'AAPL', type: 'Compra', quantity: 10, price: 180.95, total: 1809.50, date: '17/05/2025 10:23 AM' },
      { symbol: 'MSFT', type: 'Compra', quantity: 5, price: 340.27, total: 1701.35, date: '17/05/2025 9:45 AM' },
      { symbol: 'TSLA', type: 'Venta', quantity: 8, price: 200.50, total: 1604.00, date: '16/05/2025 3:22 PM' }
    ];
  }
}
