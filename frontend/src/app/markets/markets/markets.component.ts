import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Usar solo Stock y eliminar la referencia a Market
import { Stock, StockInitResponse } from '../../models/stock.model';
import { StocksService } from '../../services/stocks.service';
import { AlpacaDataService } from '../../services/alpaca-data.service';
import { SharesService } from '../../services/shares.service';
import { CreateShareDto } from '../../models/share.model';

interface ShareCreationResult {
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule
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
  
  // Propiedades para la inicialización de mercados
  isInitializingMarkets = false;
  isInitialized = false;
  
  // Propiedades para la creación de acciones
  isCreatingShare = false;
  newShareSymbol: string = '';
  selectedMarketForShare: string | null = null;
  shareCreationResult: ShareCreationResult | null = null;

  constructor(
    private stocksService: StocksService,
    private sharesService: SharesService,
    private alpacaService: AlpacaDataService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Primero intentamos cargar la lista de mercados directamente
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
  
  /**
   * Carga la lista de mercados
   * Si la lista está vacía y no hubo un error, intenta inicializar automáticamente
   */
  loadStocks(): void {
    this.isLoading = true;
    this.error = null;
    
    this.stocksService.getStocks().subscribe({
      next: (data) => {
        this.stocks = data;
        this.isInitialized = data.length > 0;
        
        // Si no hay mercados, intentamos inicializar automáticamente
        if (data.length === 0) {
          console.log('No se encontraron mercados, intentando inicializar...');
          this.initializeMarkets();
        } else {
          console.log('Mercados cargados:', this.stocks);
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los mercados. ' + err.message;
        this.isLoading = false;
        console.error('Error al cargar mercados:', err);
      }
    });
  }
  
  /**
   * Inicializa los mercados en el backend
   * Este paso es necesario antes de usar las funcionalidades de mercados
   */
  initializeMarkets(): void {
    this.isInitializingMarkets = true;
    this.shareCreationResult = null;
    
    this.stocksService.initializeMarkets().subscribe({
      next: (response: StockInitResponse) => {
        console.log('Mercados inicializados:', response);
        this.isInitialized = true;
        
        const marketCount = response.creado_o_actualizado?.length || 
                           (response.count ? response.count : 'varios');
        
        this.shareCreationResult = {
          success: true,
          message: `Se han inicializado correctamente ${marketCount} mercados.`
        };
        
        // Volvemos a cargar los mercados para mostrarlos actualizados
        this.loadStocks();
        this.isInitializingMarkets = false;
        
        // Notificación
        this.snackBar.open('Mercados inicializados correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: (err) => {
        console.error('Error al inicializar mercados:', err);
        this.shareCreationResult = {
          success: false,
          message: `Error al inicializar mercados: ${err.message || 'Error desconocido'}`
        };
        this.isInitializingMarkets = false;
        
        // Notificación de error
        this.snackBar.open('Error al inicializar mercados', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  /**
   * Crea una nueva acción usando el símbolo ingresado
   */
  createShare(): void {
    if (!this.newShareSymbol) {
      this.shareCreationResult = {
        success: false,
        message: 'Por favor, ingrese un símbolo de acción.'
      };
      return;
    }
    
    this.isCreatingShare = true;
    this.shareCreationResult = null;
    
    // Preparamos los datos para la creación
    const shareData: CreateShareDto = {
      symbol: this.newShareSymbol.toUpperCase()
    };
    
    this.sharesService.createShare(shareData).subscribe({
      next: (share) => {
        console.log('Acción creada:', share);
        this.shareCreationResult = {
          success: true,
          message: `Acción ${share.ticker} (${share.name_share}) creada exitosamente.`
        };
        this.newShareSymbol = '';
        this.isCreatingShare = false;
        
        // Notificación
        this.snackBar.open(`Acción ${share.ticker} creada correctamente`, 'Cerrar', {
          duration: 3000
        });
      },
      error: (err) => {
        console.error('Error al crear acción:', err);
        this.shareCreationResult = {
          success: false,
          message: `Error al crear acción: ${err.message || 'Error desconocido'}.`
        };
        this.isCreatingShare = false;
        
        // Notificación de error
        this.snackBar.open('Error al crear la acción', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  updateStockStatus(): void {
    // Solo actualizamos si hay mercados cargados
    if (this.stocks.length === 0 || !this.isInitialized) {
      return;
    }
    
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
  
  getStatusLabel(stock: Stock): string {
    return stock.is_open ? 'Abierto' : 'Cerrado';
  }
  
  navigateToStockDetail(stock: Stock): void {
    // Navegamos al detalle del mercado usando su MIC
    this.router.navigate(['/markets', stock.mic]);
  }
}
