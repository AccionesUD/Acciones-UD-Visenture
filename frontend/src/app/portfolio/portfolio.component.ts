import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Market } from '../models/market.model';
import { MarketServiceService } from '../services/markets.service';   
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  providers: [DatePipe, CurrencyPipe],
  imports: [RouterModule,CommonModule,FormsModule],
  standalone: true
})
export class PortfolioComponent implements OnInit {
  market: Market | undefined;
  isLoading = true;
  error: string | null = null;
  marketId: string | null = null;
constructor(private datePipe: DatePipe,
      private currencyPipe: CurrencyPipe,
      private route: ActivatedRoute,
      private router: Router,
      private marketService: MarketServiceService) {}
  // Acciones del portafolio
  stocks: { company:string ;unitValue:number;symbol: string; totalValue: number; marketName:string ;performance: number; quantity: number;color:string }[] = [
  {
      company: 'Apple',
      symbol: 'AAPL',
      quantity: 10,
      unitValue: 185,
      marketName: 'NASDAQ',
      totalValue: 10 * 185,
      performance: 4.5,
      color: 'red'
    },
    {
      company: 'Microsoft',
      symbol: 'MSFT',
      quantity: 15,
      unitValue: 330,
      marketName: 'NASDAQ',
      totalValue: 15 * 330,
      performance: 3.2,
      color: 'green'
    },
    {
      company: 'Bank of America',
      symbol: 'BAC',
      quantity: 20,
      unitValue: 35,
      marketName: 'NYSE',
      totalValue: 20 * 35,
      performance: 1.8,
      color: 'purple'
    },
    {
      company: 'Ecopetrol',
      symbol: 'ECOPETROL',
      quantity: 150,
      unitValue: 2450,
      marketName: 'BVC',
      totalValue: 150 * 2450,
      performance: 5.2,
      color: 'emerald'
    },
    {
      company: 'Bancolombia',
      symbol: 'BCOLOMBIA',
      quantity: 80,
      unitValue: 32100,
      marketName: 'BVC',
      totalValue: 80 * 32100,
      performance: 8.7,
      color: 'blue'
    },
    {
      company: 'Avianca',
      symbol: 'AVIANCA',
      quantity: 200,
      unitValue: 1890,
      marketName: 'BVC',
      totalValue: 200 * 1890,
      performance: -2.3,
      color: 'yellow'
    }];


    // Acciones filtradas (se muestran en la tabla)
  filteredStocks = [...this.stocks];

  // Opciones del menú de filtrado
  marketFilters = [
    { value: 'ALL', label: 'Todos los mercados' },
    { value: 'NASDAQ', label: 'NASDAQ' },
    { value: 'NYSE', label: 'NYSE' },
    { value: 'BVC', label: 'Bolsa de Valores de Colombia' }
  ];

  // Filtro seleccionado
  selectedFilter = 'ALL';

  // Resumen del portafolio (calculado dinámicamente)
  portfolioSummary = this.calculateSummary();
  filterStocks(market: string): void {
    this.selectedFilter = market;
    
    if (market === 'ALL') {
      this.filteredStocks = [...this.stocks];
    } else {
      this.filteredStocks = this.stocks.filter(stock => stock.marketName === market);
    }
    
    this.portfolioSummary = this.calculateSummary();
  }

  ngOnInit(): void {
    this.marketId = this.route.snapshot.paramMap.get('id'); 
    if(this.marketId){
      this.loadMarketDetails(this.marketId);
    } else {
      this.error = 'No se proporcionó un ID de mercado.';
      this.isLoading = false;
    }// Simulación de ID de mercado
  }
  loadMarketDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.marketService.getMarketById(id).subscribe({
      next: (data) => {
        if (data) {
          this.market = data;
          this.isLoading = false;
        } else {
          this.error = 'No se encontraron datos para el mercado solicitado.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los detalles del mercado: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  filterActionsByMarket(): void {
    if (!this.market) return;
    
    if (this.market.id === 'NYSE' || this.market.id === '1') {
    } else if (this.market.id === 'NASDAQ' || this.market.id === '2') {
      this.stocks = this.stocks.filter(action => 
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(action.symbol)
      );
    } else {
      this.stocks = this.stocks.slice(0, 3);
    }
  }
  // Resumen del portafolio
  private calculateSummary() {
    return {
    totalInvested: this.filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0),
    totalEarnings: this.filteredStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0),
    totalStocks: this.filteredStocks.reduce((sum, stock) => sum + stock.quantity, 0),
    totalValue: this.filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0) + 
                this.filteredStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0),
    performance: (this.filteredStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0) / 
                 this.filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0)) * 100
  };
  } 

  
}