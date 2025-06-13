import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Stock, MarketClock } from '../../models/stock.model'; 
import { Share, StockBar } from '../../models/share.model';
import { StocksService } from '../../services/stocks.service';
import { SharesService } from '../../services/shares.service';
import { AlpacaDataService } from '../../services/alpaca-data.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { SellStockModalComponent } from '../../shared/modals/sell-stock-modal/sell-stock-modal.component';
import { AlertDialogComponent } from '../../shared/modals/alert-dialog/alert-dialog.component';
import { PortfolioService } from '../../services/portfolio.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-market-detail',
  standalone: true,  
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './market-detail.component.html',  
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ])
    ])
  ]
})
export class MarketDetailComponent implements OnInit, OnDestroy {  
  stock: Stock | undefined; // Mercado actual
  shares: Share[] = []; // Lista de acciones del mercado
  isLoading = true;
  error: string | null = null;
  isLoadingShares = false;
  sharesError: string | null = null;
  marketClock: MarketClock | undefined;
  
  // Propiedades para acciones destacadas
  featuredShares: Share[] = [];
  
  // Estado de inicialización
  isInitialized = false;
  
  // Para desuscribirse de observables
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stocksService: StocksService,
    private sharesService: SharesService,
    private alpacaService: AlpacaDataService,
    private portfolioService: PortfolioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    // Primero verificamos si los mercados están inicializados
    this.isInitialized = this.stocksService.areMarketsInitialized();
    
    if (!this.isInitialized) {
      this.error = 'Los mercados no han sido inicializados. Por favor, regresa a la lista de mercados e inicializa primero.';
      this.isLoading = false;
      return;
    }
    
    this.route.params.subscribe(params => {
      const marketId = params['id'];
      if (marketId) {
        this.loadStockDetails(marketId);
      } else {
        this.error = 'No se pudo encontrar el ID del mercado';
        this.isLoading = false;
      }
    });
    
    // Actualizar estado del mercado cada minuto
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateMarketStatus());
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadStockDetails(stockId: string): void {
    this.isLoading = true;
    
    this.stocksService.getStockDetails(stockId).subscribe({
      next: (stock) => {
        this.stock = stock;
        this.isLoading = false;
        console.log('Detalle del mercado cargado:', this.stock);
        
        // Una vez que tenemos el mercado, cargamos sus acciones
        this.loadShares(stock.mic);
        // Y actualizamos el estado del mercado
        this.updateMarketStatus();
      },
      error: (err) => {
        this.error = `Error al cargar los detalles del mercado: ${err.message}`;
        this.isLoading = false;
        console.error('Error al cargar detalles del mercado:', err);
      }
    });
  }
  
  loadShares(stockMic: string): void {
    this.isLoadingShares = true;
    this.sharesError = null;
    
    this.sharesService.getSharesByMarket(stockMic).subscribe({
      next: (shares) => {
        this.shares = shares;
        this.isLoadingShares = false;
        
        // Seleccionamos algunas acciones destacadas
        if (shares.length > 0) {
          this.featuredShares = shares.slice(0, Math.min(4, shares.length));
        }
        
        console.log(`Acciones del mercado ${stockMic} cargadas:`, this.shares);
      },
      error: (err) => {
        this.sharesError = `Error al cargar las acciones del mercado: ${err.message}`;
        this.isLoadingShares = false;
        console.error(`Error al cargar acciones del mercado ${stockMic}:`, err);
      }
    });
  }
  
  updateMarketStatus(): void {
    this.alpacaService.getMarketStatus().subscribe({
      next: (status) => {
        this.marketClock = status;
        console.log('Estado del mercado actualizado:', status);
        
        // Actualizar el estado del mercado actual
        if (this.stock) {
          this.stock = {
            ...this.stock,
            is_open: status.is_open
          };
        }
      },
      error: (err) => {
        console.error('Error al actualizar estado del mercado:', err);
      }
    });
  }
  
  getStatusLabel(isOpen: boolean | undefined): string {
    return isOpen ? 'Abierto' : 'Cerrado';
  }
  
  getStatusClass(isOpen: boolean | undefined): string {
    return isOpen ? 'success' : 'closed';
  }
  
  buyShare(share: Share): void {
    // Verificar si el mercado está inicializado
    if (!this.isInitialized) {
      this.snackBar.open('Los mercados no están inicializados. Por favor, inicialícelos primero.', 'Cerrar', {
        duration: 5000
      });
      return;
    }
    
    // Implementar lógica para comprar acción
    console.log('Comprar acción:', share);
    
    // Aquí iría el código para abrir el modal de compra o redirigir a página de compra
  }
  
  navigateToShareDetail(share: Share): void {
    // Navegación al detalle de la acción
    this.router.navigate(['/actions', share.ticker]);
  }
  
  goBack(): void {
    this.router.navigate(['/markets']);
  }
}