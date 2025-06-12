import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Usar solo Stock y eliminar la referencia a Market
import { Stock } from '../../models/stock.model';
import { StocksService } from '../../services/stocks.service';
import { AlpacaDataService } from '../../services/alpaca-data.service';

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './markets.component.html',
  styleUrls: ['./markets.component.css']
})
export class MarketsComponent implements OnInit, OnDestroy {
  // Actualizar a stocks (mercados)
  stocks: Stock[] = [];
  isLoading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private stocksService: StocksService,
    private alpacaService: AlpacaDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStocks();
    
    // Actualizamos el estado del mercado cada minuto
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateStockStatus());
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStocks(): void {
    this.isLoading = true;
    this.error = null;
    
    this.stocksService.getStocks().subscribe({
      next: (data) => {
        this.stocks = data;
        this.isLoading = false;
        console.log('Mercados cargados:', this.stocks);
      },
      error: (err) => {
        this.error = 'Error al cargar los mercados. ' + err.message;
        this.isLoading = false;
        console.error('Error al cargar mercados:', err);
        
        // Intentamos inicializar los mercados en el backend (solo administrador debería poder hacerlo)
        this.initializeStocks();
      }
    });
  }
  
  private initializeStocks(): void {
    if (!this.stocks || this.stocks.length === 0) {
      console.log('Intentando inicializar mercados en el backend...');
      
      this.stocksService.initializeMarkets().subscribe({
        next: (response) => {
          console.log('Mercados inicializados:', response);
          // Volvemos a intentar cargar los mercados
          this.loadStocks();
        },
        error: (err) => {
          console.error('Error al inicializar mercados:', err);
        }
      });
    }
  }
  
  updateStockStatus(): void {
    this.alpacaService.getMarketStatus().subscribe({
      next: (status) => {
        console.log('Estado actual del mercado:', status);
        // Actualizamos el estado de los mercados
        this.stocks = this.stocks.map(stock => ({
          ...stock,
          status: status.is_open ? 'active' : 'inactive',
          is_open: status.is_open
        }));
      },
      error: (err) => {
        console.error('Error al actualizar estado de mercados:', err);
      }
    });
  }

  navigateToStockDetail(stock: Stock): void {
    // Navegamos al detalle del mercado usando su MIC
    this.router.navigate(['/markets', stock.mic]);
  }
  
  getStatusLabel(stock: Stock): string {
    return stock.is_open ? 'Abierto' : 'Cerrado';
  }
  
  getStatusClass(stock: Stock): string {
    return stock.is_open ? 'success' : 'closed';
  }
  
  getTimeRemainingLabel(stock: Stock): string {
    if (stock.is_open) {
      // Lógica para calcular el tiempo restante hasta el cierre
      return 'Cierra pronto';
    } else {
      // Lógica para calcular el tiempo hasta la apertura
      return 'Abre pronto';
    }
  }
}
