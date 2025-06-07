import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { format, subDays } from 'date-fns';
import { MockChartDataService } from '../services/mock-data-chart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  providers: [MockChartDataService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  watchlistStocks: any[] = [];
  transactions: any[] = [];
  isLoading = true;
  useMockData = false;
  currentSymbol = 'AAPL';

  // Configuración API Alpaca
  private readonly ALPACA_API_KEY = 'tu_api_key';
  private readonly ALPACA_API_SECRET = 'tu_api_secret';
  private readonly ALPACA_BASE_URL = 'https://data.alpaca.markets/v2';

  constructor(
    private http: HttpClient,
    private mockData: MockChartDataService
  ) {}

  ngOnInit(): void {
    this.loadWatchlist();
    this.loadTransactions();
    this.loadChartData(this.currentSymbol);
  }

  loadChartData(symbol: string): void {
    this.isLoading = true;
    this.currentSymbol = symbol;

    if (this.useMockData) {
      this.loadMockData(symbol);
    } else {
      this.loadRealData(symbol);
    }
  }

  private loadRealData(symbol: string): void {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    this.http.get(`${this.ALPACA_BASE_URL}/stocks/${symbol}/bars`, {
      headers: {
        'APCA-API-KEY-ID': this.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': this.ALPACA_API_SECRET
      },
      params: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        timeframe: '1Day',
        adjustment: 'all'
      }
    }).subscribe({
      next: (response: any) => this.processChartData(response.bars, symbol),
      error: (err) => {
        console.error('Error al cargar datos reales, usando mocks', err);
        this.loadMockData(symbol);
      },
      complete: () => this.isLoading = false
    });
  }

  private loadMockData(symbol: string): void {
    this.mockData.generateMockData(symbol).subscribe({
      next: (response: { bars: any[]; }) => this.processChartData(response.bars, symbol),
      error: (err: any) => this.showErrorState(symbol, err),
      complete: () => this.isLoading = false
    });
  }

  processChartData(bars: any[], symbol: string): void {
    if (!bars || bars.length === 0) {
      this.showEmptyState(symbol);
      return;
    }

    const ohlc = bars.map(bar => [
      new Date(bar.t).getTime(), // timestamp
      bar.o, // open
      bar.h, // high
      bar.l, // low
      bar.c  // close
    ]);

    const volume = bars.map(bar => [
      new Date(bar.t).getTime(), // timestamp
      bar.v  // volume
    ]);

    this.chartOptions = {
      title: { text: `${symbol} - ${this.useMockData ? 'Datos Simulados' : 'Datos Reales'}` },
      subtitle: { text: `Últimos ${bars.length} días` },
      series: [{
        type: 'candlestick',
        name: `${symbol} Price`,
        data: ohlc,
        color: '#26a69a', // verde
        upColor: '#ef5350', // rojo
        tooltip: { valueDecimals: 2 }
      }, {
        type: 'column',
        name: 'Volume',
        data: volume,
        yAxis: 1,
        color: '#78909c' // gris
      }],
      yAxis: [{
        title: { text: 'Precio' },
        height: '70%'
      }, {
        title: { text: 'Volumen' },
        top: '75%',
        height: '25%',
        offset: 0
      }],
      plotOptions: {
        candlestick: {
          lineColor: '#78909c'
        }
      }
    };
  }

  toggleDataMode(): void {
    this.useMockData = !this.useMockData;
    this.loadChartData(this.currentSymbol);
  }

  testMarketScenario(scenario: string): void {
    if (!this.useMockData) {
      this.useMockData = true;
    }

    switch(scenario) {
      case 'bull':
        this.mockData.generateBullMarket(this.currentSymbol).subscribe((data:any) => {
          this.processChartData(data.bars, this.currentSymbol);
        });
        break;
      case 'bear':
        this.mockData.generateBearMarket(this.currentSymbol).subscribe((data: any) => {
          this.processChartData(data.bars, this.currentSymbol);
        });
        break;
      case 'sideways':
        this.mockData.generateSidewaysMarket(this.currentSymbol).subscribe((data : any) => {
          this.processChartData(data.bars, this.currentSymbol);
        });
        break;
      case 'volatile':
        this.mockData.generateVolatileMarket(this.currentSymbol).subscribe((data: any) => {
          this.processChartData(data.bars, this.currentSymbol);
        });
        break;
      case 'gap':
        this.mockData.generateMarketWithGap(this.currentSymbol).subscribe((data: any) => {
          this.processChartData(data.bars, this.currentSymbol);
        });
        break;
      default:
        this.loadChartData(this.currentSymbol);
    }
  }

  private showEmptyState(symbol: string): void {
    this.chartOptions = {
      title: { text: `${symbol} - Sin datos disponibles` },
      series: [{
        type: 'line',
        data: [],
        name: 'No hay datos'
      }]
    };
    this.isLoading = false;
  }

  private showErrorState(symbol: string, error: any): void {
    console.error('Error:', error);
    this.chartOptions = {
      title: { text: `${symbol} - Error al cargar datos` },
      series: [{
        type: 'line',
        data: [],
        name: 'Error'
      }]
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