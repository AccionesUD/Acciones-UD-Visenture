import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FiltersComponent } from './filters/filters.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { PortfolioSummary, Stock, PortfolioShare } from '../models/portfolio.model';
import { SortOption, PerformanceFilterOption } from '../models/filters.model';
import { PortfolioService } from '../services/portfolio.service';
import { CustomPaginatorIntl } from '../shared/custom-paginator-intl';
import { SellStockModalComponent } from '../shared/modals/sell-stock-modal/sell-stock-modal.component';
import { AlertDialogComponent } from '../shared/modals/alert-dialog/alert-dialog.component';
import { BuyStockModalComponent } from '../shared/modals/buy-stock-modal/buy-stock-modal.component';
@Component({  
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  standalone: true,  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    FiltersComponent, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ]
})
export class PortfolioComponent implements OnInit, OnDestroy {

  @ViewChild('filtersComponent') filtersComponent?: FiltersComponent;
  @ViewChild('stocksTable') stocksTable?: ElementRef;
  
  // Estado de la carga de datos
  isLoading = true;
  error: string | null = null;
  selectedFilter = 'ALL'; // Variable necesaria para el template
  selectedPerformanceFilter: PerformanceFilterOption | null = null;
  
  // Datos de acciones
  stocks: Stock[] = [];
  filteredStocks: Stock[] = [];
  displayedStocks: Stock[] = []; // Acciones a mostrar después de la paginación
  
  // DataSource para MatTable
  dataSource = new MatTableDataSource<Stock>([]);
  displayedColumns: string[] = ['symbol', 'marketName', 'quantity', 'unitValue', 'totalValue', 'performance', 'actions'];
  
  // Configuración de paginación
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageIndex = 0;
  totalStocks = 0;
  
  // Filtros y ordenamiento
  marketFilters = [
    { value: 'ALL', label: 'Todos los mercados' },
    { value: 'NASDAQ', label: 'NASDAQ' },
    { value: 'NYSE', label: 'NYSE' },
    { value: 'BVC', label: 'Bolsa de Valores de Colombia' }
  ];
  
  // Resumen del portafolio
  portfolioSummary: PortfolioSummary = {
    totalInvested: 0,
    totalEarnings: 0,
    totalShares: 0,
    totalValue: 0,
    performance: 0
  };
  constructor(
    private portfolioService: PortfolioService,
    private dialog: MatDialog
  ) {}  
  
  // Variable para mantener el estado del tema
  isDarkMode = false;
  ngOnInit(): void {
    // Utilizamos isPlatformBrowser en vez de document directamente
    // Esto nos ayudará con la renderización del lado del servidor
    if (typeof window !== 'undefined') {
      // Solo ejecuta código relacionado con document en el navegador
      this.isDarkMode = document.body.classList.contains('dark-theme');
      
      // Detector de cambios en el tema sólo en el navegador
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            this.isDarkMode = document.body.classList.contains('dark-theme');
          }
        });
      });
      
      observer.observe(document.body, { attributes: true });
      
      // Añadir detector de cambio de tamaño para actualizar el indicador de desplazamiento      window.addEventListener('resize', this.resizeHandler);
    }
    
    // Simulamos una carga de datos
    this.isLoading = true;
    
    // Cargar datos mediante el servicio
    this.loadPortfolioData();
  }

  /**
   * Carga los datos del portafolio desde el servicio
   */
  private loadPortfolioData(): void {
    this.isLoading = true;
    this.error = null;
    this.portfolioService.getPortfolioStocks().subscribe({
      next: (shares: PortfolioShare[]) => {
        this.stocks = shares.map(share => ({
          id: share.id.toString(), 
          company: share.companyName,
          symbol: share.ticker,
          marketName: share.stockName,
          marketId: share.stockMic,
          quantity: share.quantity,
          unitValue: share.unitValue,
          totalValue: share.totalValue,
          performance: share.performance,
          color: share.color
        }));
        this.applyFilters();
        this.updateDisplayedStocks();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar acciones', error);
        // Fallback con datos simulados
        console.warn('Usando datos de fallback del portafolio');
        const fallbackShares: PortfolioShare[] = [
          {
            id: '0',
            companyName: 'Mock Company',
            ticker: 'MOCK',
            stockName: 'NASDAQ',
            stockMic: 'XNAS',
            quantity: 10,
            unitValue: 100,
            totalValue: 1000,
            performance: 5,
            color: 'emerald'
          }
        ];
        // Mapear fallbackShares a stocks
        this.stocks = fallbackShares.map(share => ({
          id: share.id.toString(),
          company: share.companyName,
          symbol: share.ticker,
          marketName: share.stockName,
          marketId: share.stockMic,
          quantity: share.quantity,
          unitValue: share.unitValue,
          totalValue: share.totalValue,
          performance: share.performance,
          color: share.color
        }));
        // Aplicar filtros y paginación
        this.applyFilters();
        this.updateDisplayedStocks();
        this.isLoading = false;
      }
    });
  }
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedStocks();
    
    // Hacer scroll hasta el inicio de la tabla
    setTimeout(() => {
      if (this.stocksTable) {
        this.stocksTable.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }, 100); // Pequeño retraso para asegurar que la tabla se ha actualizado
  }  updateDisplayedStocks(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.totalStocks = this.filteredStocks.length;
    this.displayedStocks = this.filteredStocks.slice(startIndex, startIndex + this.pageSize);
    
    // Actualizar el dataSource para MatTable
    this.dataSource.data = this.displayedStocks;
    
    // Verificar si la tabla necesita scroll horizontal después de que los datos se actualicen
    setTimeout(() => {
      this.checkTableOverflow();
      
      // Tras actualizar datos, asegurar que el paginador esté correctamente posicionado
      if (this.stocksTable && this.stocksTable.nativeElement) {
        const paginatorContainer = this.stocksTable.nativeElement.querySelector('mat-paginator');
        const contentContainer = this.stocksTable.nativeElement.querySelector('.min-w-full');
        
        if (paginatorContainer && contentContainer) {
          // Asegurarnos de que el paginador tiene al menos el mismo ancho que el contenido
          paginatorContainer.style.minWidth = contentContainer.scrollWidth + 'px';
        }
      }
    }, 100);
  }

  filterStocks(market: string): void {
    this.selectedFilter = market; // Actualizamos la variable de filtro seleccionado
    this.applyFilters();
  }

  filterByPerformance(option: PerformanceFilterOption): void {
    this.selectedPerformanceFilter = option;
    this.applyFilters();
  }

  private applyFilters(): void {
    // Paso 1: Filtrar por mercado
    let result = [...this.stocks];
    
    if (this.selectedFilter !== 'ALL') {
      result = result.filter(stock => stock.marketName === this.selectedFilter);
    }
    
    // Paso 2: Filtrar por rendimiento
    if (this.selectedPerformanceFilter && this.selectedPerformanceFilter.value !== 'all') {
      const min = this.selectedPerformanceFilter.min !== undefined ? this.selectedPerformanceFilter.min : null;
      const max = this.selectedPerformanceFilter.max !== undefined ? this.selectedPerformanceFilter.max : null;
      
      result = result.filter(stock => {
        if (min !== null && max !== null) {
          return stock.performance >= min && stock.performance <= max;
        } else if (min !== null) {
          return stock.performance >= min;
        } else if (max !== null) {
          return stock.performance <= max;
        }
        return true;
      });
    }    
    this.filteredStocks = result;
    this.calculatePortfolioSummary();
    this.pageIndex = 0; // Volver a la primera página cuando se aplican filtros
    this.updateDisplayedStocks();
  }
  sortStocks(sortOption: SortOption): void {
    console.log('Sorting with option:', sortOption);
    
    if (!sortOption || sortOption.value === 'none') {
      // Si no hay ordenamiento, reaplicamos los filtros para restaurar el orden original
      this.applyFilters();
      return;
    }
    
    if (!sortOption.property) {
      console.warn('Sort option does not specify a property to sort by:', sortOption);
      return;
    }
    
    this.filteredStocks.sort((a, b) => {
      const valueA = a[sortOption.property as keyof Stock];
      const valueB = b[sortOption.property as keyof Stock];
      
      // Manejo de valores nulos o indefinidos
      if (valueA === null || valueA === undefined) {
        return sortOption.direction === 'asc' ? -1 : 1;
      }
      if (valueB === null || valueB === undefined) {
        return sortOption.direction === 'asc' ? 1 : -1;
      }
      
      // Comparación específica para valores numéricos 
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOption.direction === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
      
      // Para otros tipos de datos (cadenas, etc.)
      const strA = String(valueA);
      const strB = String(valueB);
      
      if (sortOption.direction === 'asc') {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
    
    // Actualizar las acciones mostradas después de ordenarlas
    this.updateDisplayedStocks();
  }

    private calculatePortfolioSummary(): void {
    const totalInvested = this.filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalEarnings = this.filteredStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0);
    this.portfolioSummary = {
      totalInvested,
      totalEarnings,
      totalShares: this.filteredStocks.reduce((sum, stock) => sum + stock.quantity, 0),
      totalValue: totalInvested + totalEarnings,
      performance: totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0
    };
  }
    resetFilters(): void {
    this.selectedFilter = 'ALL';
    this.selectedPerformanceFilter = null;
    this.filteredStocks = [...this.stocks]; // Restaurar todas las acciones
    this.calculatePortfolioSummary();
    this.pageIndex = 0; // Volver a la primera página
    this.updateDisplayedStocks();
    
    // Resetear los selectores en el componente hijo
    if (this.filtersComponent) {
      this.filtersComponent.resetAllFilters();
    }
  }
  /**
   * Abre el modal de compra para una acción específica
   * @param stock Acción a comprar
   */ 
abrirModalCompra(stock: Stock): void {
  const dialogRef = this.dialog.open(BuyStockModalComponent, {
    width: '500px',
    maxHeight: '90vh',
    data: { 
      stock, 
      price: stock.unitValue,
      maxQuantity: 1000 // Puedes ajustar esto según tu lógica de negocio
    },
    panelClass: 'custom-dialog-container',
    autoFocus: false
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.success) {
      // Si la compra se completó, mostrar mensaje de éxito
      if (result.status === 'completed') {
        this.dialog.open(AlertDialogComponent, {
          width: '400px',
          data: { 
            title: 'Compra completada',
            message: `Has comprado ${result.filledQuantity} acciones de ${stock.company} por un total de ${result.totalAmount.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}. 
                    Se aplicó una comisión de ${result.fee.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}.`,
            buttonText: 'Aceptar'
          }
        });
      } else if (result.status === 'pending') {
        this.dialog.open(AlertDialogComponent, {
          width: '400px',
          data: { 
            title: 'Orden registrada',
            message: `Tu orden de compra para ${result.filledQuantity} acciones de ${stock.company} ha sido registrada y está pendiente de ejecución.`,
            buttonText: 'Aceptar'
          }
        });
      }
      
      // Recargar datos del portafolio después de una compra exitosa
      this.loadPortfolioData();
      this.filtersComponent?.resetAllFilters();
    }
  });
}

  /**
   * Abre el modal de venta para una acción específica
   * @param stock Acción a vender
   */  abrirModalVenta(stock: Stock): void {
    const dialogRef = this.dialog.open(SellStockModalComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: { 
        stock, 
        price: stock.unitValue 
      },
      panelClass: 'custom-dialog-container',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Si la orden se completó, mostrar mensaje de éxito
        if (result.status === 'completed') {
          // Mostrar un mensaje de confirmación
          this.dialog.open(AlertDialogComponent, {
            width: '400px',
            data: { 
              title: 'Venta completada',
              message: `Se han vendido ${result.filledQuantity} acciones de ${stock.company} por un total de ${result.totalAmount.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}. 
                      Se aplicó una comisión de ${result.fee.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}.`,
              buttonText: 'Aceptar'
            }
          });
        } else if (result.status === 'pending') {
          // Mostrar mensaje para órdenes pendientes
          this.dialog.open(AlertDialogComponent, {
            width: '400px',
            data: { 
              title: 'Orden registrada',
              message: `Su orden de venta para ${result.filledQuantity || stock.quantity} acciones de ${stock.company} ha sido registrada y está pendiente de ejecución.`,
              buttonText: 'Aceptar'
            }
          });
        }
        
        // Recargar datos del portafolio después de una venta exitosa
        this.loadPortfolioData();
        this.filtersComponent?.resetAllFilters();
      }
    });
  }
  /**
   * Verifica si una tabla necesita desplazamiento horizontal
   * y actualiza la visibilidad del indicador de desplazamiento.
   * También asegura que el encabezado y el paginador tengan el mismo ancho que la tabla.
   */
  checkTableOverflow(): void {
    if (this.stocksTable && this.stocksTable.nativeElement) {
      const tableContainer = this.stocksTable.nativeElement.querySelector('.overflow-x-auto');
      if (tableContainer) {
        // Verificamos si el contenido es más ancho que el contenedor
        const contentWidth = tableContainer.querySelector('.min-w-full')?.scrollWidth || tableContainer.scrollWidth;
        const containerWidth = tableContainer.clientWidth;
        const hasOverflow = contentWidth > containerWidth;
        const scrollIndicator = tableContainer.querySelector('.scroll-indicator');
        
        if (scrollIndicator) {
          // Solo mostrar el indicador si hay overflow
          if (hasOverflow) {
            scrollIndicator.classList.remove('hidden');
          } else {
            scrollIndicator.classList.add('hidden');
          }
        }
        
        // Remover cualquier listener previo para evitar duplicados
        const oldListener = tableContainer.onscroll;
        if (oldListener) {
          tableContainer.removeEventListener('scroll', oldListener);
        }
        
        // Ocultar indicador cuando el usuario ha hecho scroll completo
        const scrollHandler = () => {
          if (scrollIndicator && tableContainer.scrollLeft + tableContainer.clientWidth >= tableContainer.scrollWidth - 10) {
            scrollIndicator.style.opacity = '0';
          } else {
            scrollIndicator.style.opacity = '0.7';
          }
        };
        
        tableContainer.addEventListener('scroll', scrollHandler);
        tableContainer.onscroll = scrollHandler; // Guardar la referencia para poder eliminarla después
      }
    }
  }
  ngOnDestroy(): void {
    // Limpiar los event listeners al destruir el componente
    if (typeof window !== 'undefined') {
      // Remover el evento resize usando una referencia real a la función
      window.removeEventListener('resize', this.resizeHandler);
      
      // También limpiar el evento de scroll si existe
      if (this.stocksTable && this.stocksTable.nativeElement) {
        const tableContainer = this.stocksTable.nativeElement.querySelector('.overflow-x-auto');
        if (tableContainer && tableContainer.onscroll) {
          tableContainer.removeEventListener('scroll', tableContainer.onscroll);
          tableContainer.onscroll = null;
        }
      }
    }
  }
  
  // Referencia para el event listener de resize
  private resizeHandler = () => {
    this.checkTableOverflow();
  };
}