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
import { Subject, interval, forkJoin } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { BuyStockModalComponent } from '../../shared/modals/buy-stock-modal/buy-stock-modal.component';
import { SnapshotModalComponent, SnapshotData } from '../../shared/modals/snapshot-modal/snapshot-modal.component';
import { OrderTypeSelectionDialogComponent } from '../../shared/modals/order-type-selection-dialog/order-type-selection-dialog.component';
import { AuthService } from '../../services/auth.service';

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
  shareQuotes: Record<string, { price: number; changePercent: number } | undefined> = {};
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
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) { }
    ngOnInit(): void {
    // Ya no comprobamos la inicialización, sino que confiamos en que el servicio lo manejará
    console.log('[MarketDetail] Iniciando componente de detalle de mercado');
    
    this.route.params.subscribe(params => {
      const marketId = params['id'];
      if (marketId) {
        console.log(`[MarketDetail] Cargando detalles del mercado con ID: ${marketId}`);
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
    console.log(`[MarketDetail] Solicitando detalles del mercado ${stockId}`);
    
    // Si los mercados no están inicializados, el servicio se encargará de inicializarlos
    this.stocksService.getStockDetails(stockId).subscribe({
      next: (stock) => {
        this.stock = stock;
        this.isInitialized = true; // Si llegamos aquí, significa que hay datos disponibles
        this.isLoading = false;
        console.log('[MarketDetail] Detalle del mercado cargado:', this.stock);
        
        // Una vez que tenemos el mercado, cargamos sus acciones
        this.loadShares(stock.mic);
        // Y actualizamos el estado del mercado
        this.updateMarketStatus();
      },
      error: (err) => {
        console.error('[MarketDetail] Error al cargar detalles del mercado:', err);
        
        if (err.message && err.message.includes('inicializar')) {
          // Error específico de inicialización
          this.error = 'Es necesario inicializar los mercados. Se intentará hacer automáticamente...';
          
          // Intentar inicializar los mercados automáticamente
          this.initializeMarketsAndRetry(stockId);
        } else {
          this.error = `Error al cargar los detalles del mercado: ${err.message}`;
          this.isLoading = false;
        }
      }
    });
  }
  
  loadShares(stockMic: string): void {
    this.isLoadingShares = true;
    this.sharesError = null;
    
    console.log(`[MarketDetail] Solicitando acciones para mercado con MIC: ${stockMic}`);
    
    this.sharesService.getSharesByMarket(stockMic).subscribe({
      next: (shares) => {
        console.log(`[MarketDetail] Recibidas ${shares.length} acciones para el mercado ${stockMic}`);
        this.shares = shares;
        
        // Mostrar debug de los primeros 3 elementos si hay acciones
        if (shares.length > 0) {
          const debugSample = shares.slice(0, 3).map(s => ({ 
            ticker: s.ticker, 
            name: s.name_share,
            mic: s.stock 
          }));
          console.log('[MarketDetail] Muestra de acciones recibidas:', debugSample);
        } else {
          console.warn(`[MarketDetail] No se encontraron acciones para el mercado ${stockMic}`);
        }
        
        this.isLoadingShares = false;
        
        // Cargar cotizaciones actuales para cada acción
        if (shares.length > 0) {
          console.log(`[MarketDetail] Solicitando cotizaciones en tiempo real para ${shares.length} acciones`);
          // Filtramos las acciones que tienen ticker definido
          const sharesWithTickers = this.shares.filter(s => s.ticker);
          console.log(`[MarketDetail] ${sharesWithTickers.length} acciones tienen ticker definido`);
          
          if (sharesWithTickers.length > 0) {
            const quoteCalls = this.shares.map(s =>
              this.alpacaService.getSymbolSnapshot(s.symbol).pipe(
                map(snapshot => {
                  console.log(`[MarketDetail] Snapshot recibido para ${s.symbol}:`, snapshot);
                  return {
                    symbol: s.symbol,
                    price: snapshot.latestTrade?.price,
                    changePercent: snapshot.latestQuote
                      ? (snapshot.latestQuote.askPrice - snapshot.latestQuote.bidPrice) / snapshot.latestQuote.bidPrice * 100
                      : 0
                  };
                })
              )
            );
            forkJoin(quoteCalls).subscribe(results => {
              results.forEach(q => this.shareQuotes[q.symbol] = { price: q.price!, changePercent: q.changePercent! });
            });
          }
        }

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
    console.log('[MarketDetail] Actualizando estado del mercado');
    
    this.alpacaService.getMarketStatus().subscribe({
      next: (status) => {
        this.marketClock = status;
        console.log('[MarketDetail] Estado del mercado recibido de Alpaca:', status);
        
        // Formatear fechas para mostrar información más útil
        const currentTime = new Date(status.timestamp);
        const nextOpenTime = new Date(status.next_open);
        const nextCloseTime = new Date(status.next_close);
        
        console.log(`[MarketDetail] Hora actual: ${currentTime.toLocaleString()}`);
        console.log(`[MarketDetail] Próxima apertura: ${nextOpenTime.toLocaleString()}`);
        console.log(`[MarketDetail] Próximo cierre: ${nextCloseTime.toLocaleString()}`);
        console.log(`[MarketDetail] ¿Mercado abierto?: ${status.is_open}`);
        
        // Actualizar el estado del mercado actual
        if (this.stock) {
          this.stock = {
            ...this.stock,
            status: status.is_open ? 'active' : 'inactive',
            is_open: status.is_open
          };
          console.log(`[MarketDetail] Estado del mercado ${this.stock.name_market} actualizado a ${status.is_open ? 'abierto' : 'cerrado'}`);
        }
      },
      error: (err) => {
        console.error('[MarketDetail] Error al actualizar estado del mercado:', err);
        
        // Si falla la actualización de estado, intentamos determinar el estado basado en la hora local
        // como fallback (menos preciso pero funcional)
        if (this.stock) {
          try {
            const [openHour, openMinute] = this.stock.opening_time.split(':').map(Number);
            const [closeHour, closeMinute] = this.stock.closing_time.split(':').map(Number);
            
            const now = new Date();
            const day = now.getDay();
            
            // Verificar si es fin de semana (0 = Domingo, 6 = Sábado)
            let isOpen = false;
            if (day !== 0 && day !== 6) {
              const hours = now.getHours();
              const minutes = now.getMinutes();
              const currentTimeInMinutes = hours * 60 + minutes;
              const openTimeInMinutes = openHour * 60 + openMinute;
              const closeTimeInMinutes = closeHour * 60 + closeMinute;
              
              isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
            }
            
            console.log(`[MarketDetail] Estado calculado localmente: ${isOpen ? 'abierto' : 'cerrado'}`);
            this.stock = {
              ...this.stock,
              status: isOpen ? 'active' : 'inactive',
              is_open: isOpen
            };
          } catch (e) {
            console.error('[MarketDetail] Error al calcular estado local:', e);
          }
        }
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
    // Obtener precio actual y abrir modal de compra
    const symbol = share.symbol;
    if (!symbol) {
      this.snackBar.open('Símbolo de acción inválido.', 'Cerrar', { duration: 3000 });
      return;
    }

    // Verificar si el usuario es un comisionista
    const isCommissioner = this.authService.isCommissioner();

    this.alpacaService.getSymbolSnapshot(symbol).subscribe({
      next: snapshot => {
        const price = snapshot.latestTrade?.price ?? 0;
        
        // Creamos un objeto de tipo Stock compatible con BuyStockModalComponent
        const stockForModal: any = {
          id: share.id?.toString() || '',
          symbol: share.symbol,
          company: share.name_share,
          marketName: this.stock?.name_market || 'Desconocido',
          marketId: this.stock?.mic || '',
          quantity: 0, // No se posee aún
          unitValue: price,
          totalValue: 0,
          performance: 0,
          color: 'blue', // Color por defecto
          returnOfMoney: 0,
          orderType: 'N/A',
          limitPrice: null,
          stopPrice: null,
          current_price: price,
          name: share.name_share,
          exchange: share.stock?.mic || '',
          type: share.class || '',
          currency: 'USD',
        };
        
        // Si es comisionista, primero mostrar el diálogo de selección de tipo de orden
        if (isCommissioner) {
          const orderTypeDialogRef = this.dialog.open(OrderTypeSelectionDialogComponent, {
            width: '500px',
            data: {
              shareSymbol: symbol,
              orderType: 'buy'
            },
            panelClass: 'custom-dialog-container',
            autoFocus: false
          });
          
          orderTypeDialogRef.afterClosed().subscribe(orderTypeResult => {
            if (!orderTypeResult) return; // El usuario canceló
            
            // Abrimos el modal de compra, pasando el clientId si es para un cliente
            const dialogRef = this.dialog.open(BuyStockModalComponent, {
              width: '500px',
              maxHeight: '90vh',
              data: {
                stock: stockForModal,
                price: price,
                maxQuantity: 1000,
                clientId: orderTypeResult.orderFor === 'client' ? orderTypeResult.clientId : undefined
              },
              panelClass: 'custom-dialog-container',
              autoFocus: false
            });
            
            dialogRef.afterClosed().subscribe(result => {
              if (result?.success) {
                const forClientText = orderTypeResult.orderFor === 'client' ? ' para el cliente' : '';
                this.snackBar.open(`Compra completada exitosamente${forClientText}.`, 'Aceptar', { duration: 3000 });
                // Opcional: recargar acciones o actualizar estado
              }
            });
          });
        } else {
          // Usuario normal, abrir directamente el modal de compra
          const dialogRef = this.dialog.open(BuyStockModalComponent, {
            width: '500px',
            maxHeight: '90vh',
            data: {
              stock: stockForModal,
              price: price,
              maxQuantity: 1000
            },
            panelClass: 'custom-dialog-container',
            autoFocus: false
          });
          
          dialogRef.afterClosed().subscribe(result => {
            if (result?.success) {
              this.snackBar.open('Compra completada exitosamente.', 'Aceptar', { duration: 3000 });
              // Opcional: recargar acciones o actualizar estado
            }
          });
        }
      },
      error: err => {
        console.error('Error al obtener snapshot para compra:', err);
        this.snackBar.open(`No se pudo obtener precio para ${symbol}.`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  navigateToShareDetail(share: Share): void {
    const symbol = share.symbol;
    if (!symbol) {
      this.snackBar.open('Símbolo inválido para detalles.', 'Cerrar', { duration: 3000 });
      return;
    }
    // Mostrar snapshot en modal
    this.alpacaService.getSymbolSnapshot(symbol).subscribe({
      next: snapshot => {
        const data: SnapshotData = snapshot;
        this.dialog.open(SnapshotModalComponent, { data });
      },
      error: err => {
        console.error('Error al obtener snapshot para detalles:', err);
        this.snackBar.open('No se pudo obtener detalles de snapshot.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  /**
   * Navegar de vuelta a la lista de mercados
   */
  goBack(): void {
    this.router.navigate(['/markets']);
  }
  
  /**
   * Inicializa los mercados y luego reintenta cargar los detalles del mercado específico
   */
  private initializeMarketsAndRetry(stockId: string): void {
    console.log('[MarketDetail] Intentando inicializar mercados automáticamente');
    
    this.stocksService.initializeMarkets().subscribe({
      next: (response) => {
        console.log('[MarketDetail] Mercados inicializados automáticamente:', response);
        
        // Mostramos mensaje de éxito brevemente
        this.snackBar.open('Mercados inicializados correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        
        // Volver a intentar cargar los detalles del mercado después de la inicialización
        setTimeout(() => {
          console.log('[MarketDetail] Reintentando cargar detalles del mercado');
          this.error = null;
          this.loadStockDetails(stockId);
        }, 1000);
      },
      error: (err) => {
        console.error('[MarketDetail] Error durante la inicialización automática:', err);
        this.error = `No se pudieron inicializar los mercados: ${err.message}. Por favor, intenta desde la página principal.`;
        this.isLoading = false;
        
        // Mostramos mensaje de error
        this.snackBar.open('Error al inicializar mercados', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  sellShare(share: Share): void {
    const symbol = share.symbol;
    if (!symbol) {
      this.snackBar.open('Símbolo de acción inválido.', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Verificar si el usuario es un comisionista
    const isCommissioner = this.authService.isCommissioner();
    
    this.alpacaService.getSymbolSnapshot(symbol).subscribe({
      next: snapshot => {
        const price = snapshot.latestTrade?.price ?? 0;
        
        // Creamos un objeto de tipo Stock compatible con SellStockModalComponent
        const stockForModal = {
          symbol: share.symbol,
          name: share.name_share,
          exchange: share.stock?.mic || '',
          type: share.class || '',
          currency: 'USD',
          current_price: price,
          unitValue: price
        };
        
        // Si es comisionista, primero mostrar el diálogo de selección de tipo de orden
        if (isCommissioner) {
          const orderTypeDialogRef = this.dialog.open(OrderTypeSelectionDialogComponent, {
            width: '500px',
            data: {
              shareSymbol: symbol,
              orderType: 'sell'
            },
            panelClass: 'custom-dialog-container',
            autoFocus: false
          });
          
          orderTypeDialogRef.afterClosed().subscribe(orderTypeResult => {
            if (!orderTypeResult) return; // El usuario canceló
            
            // Abrimos el modal de venta, pasando el clientId si es para un cliente
            const dialogRef = this.dialog.open(SellStockModalComponent, {
              width: '500px',
              maxHeight: '90vh',
              data: { 
                stock: stockForModal, 
                price: price,
                clientId: orderTypeResult.orderFor === 'client' ? orderTypeResult.clientId : undefined
              },
              panelClass: 'custom-dialog-container',
              autoFocus: false
            });
            
            dialogRef.afterClosed().subscribe(result => {
              if (result && result.success) {
                const forClientText = orderTypeResult.orderFor === 'client' ? ' para el cliente' : '';
                this.snackBar.open(`Orden de venta procesada exitosamente${forClientText}.`, 'Aceptar', { duration: 3000 });
                
                // Opcional: mostrar un diálogo de confirmación más detallado
                if (result.status === 'completed') {
                  this.dialog.open(AlertDialogComponent, {
                    width: '400px',
                    data: { 
                      title: 'Venta completada',
                      message: `${orderTypeResult.orderFor === 'client' ? 'El cliente ha' : 'Has'} vendido ${result.quantity} acciones de ${symbol} por un total de ${result.totalAmount.toFixed(2)} USD.`,
                      icon: 'check_circle',
                      confirmText: 'Aceptar'
                    }
                  });
                }
              }
            });
          });
        } else {
          // Usuario normal, abrir directamente el modal de venta
          const dialogRef = this.dialog.open(SellStockModalComponent, {
            width: '500px',
            maxHeight: '90vh',
            data: { 
              stock: stockForModal, 
              price: price 
            },
            panelClass: 'custom-dialog-container',
            autoFocus: false
          });
          
          dialogRef.afterClosed().subscribe(result => {
            if (result && result.success) {
              this.snackBar.open('Orden de venta procesada exitosamente.', 'Aceptar', { duration: 3000 });
              
              // Opcional: mostrar un diálogo de confirmación más detallado
              if (result.status === 'completed') {
                this.dialog.open(AlertDialogComponent, {
                  width: '400px',
                  data: { 
                    title: 'Venta completada',
                    message: `Has vendido ${result.quantity} acciones de ${symbol} por un total de ${result.totalAmount.toFixed(2)} USD.`,
                    icon: 'check_circle',
                    confirmText: 'Aceptar'
                  }
                });
              }
            }
          });
        }
      },
      error: err => {
        console.error('[MarketDetail] Error al obtener snapshot para venta:', err);
        this.snackBar.open(`No se pudo obtener precio para ${symbol}.`, 'Cerrar', { duration: 3000 });
      }
    });
  }
}