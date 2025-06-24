import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlpacaDataService } from '../../../services/alpaca-data.service';
import { StocksService } from '../../../services/stocks.service';
import { PortfolioService } from '../../../services/portfolio.service';
import { Observable, Subject, of, fromEvent } from 'rxjs';
import { map, takeUntil, debounceTime, switchMap, catchError, startWith } from 'rxjs/operators';

export interface StockSelectionDialogData {
  action: 'buy' | 'sell';
  clientId: number;
  clientName: string;
}

@Component({
  selector: 'app-stock-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './stock-selection-dialog.component.html',
  styleUrls: ['./stock-selection-dialog.component.css']
})
export class StockSelectionDialogComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  searchForm: FormGroup;
  filteredStocks: any[] = [];
  isLoadingStocks = false;
  selectedStock: any = null;
  
  // Para la vista de venta
  clientPortfolio: any[] = [];
  isLoadingPortfolio = false;
  portfolioError: string | null = null;
  
  // Para el autocompletado personalizado
  showAutocomplete = false;
  autocompleteActiveIndex = -1;
  clickedOutside = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<StockSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockSelectionDialogData,
    private fb: FormBuilder,
    private alpacaService: AlpacaDataService,
    private stocksService: StocksService,
    private portfolioService: PortfolioService
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    // Si es una venta, cargar el portafolio del cliente
    if (this.data.action === 'sell') {
      this.loadClientPortfolio();
    }

    // Configurar el autocompletado para búsqueda de acciones
    this.setupAutoComplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Detectar clics fuera del autocompletado para cerrarlo
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.searchInput && !this.searchInput.nativeElement.contains(event.target)) {
      this.showAutocomplete = false;
    } else {
      this.showAutocomplete = true;
    }
  }

  // Manejar eventos de teclado para navegación en el autocompletado
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.showAutocomplete) return;
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.autocompleteActiveIndex = Math.min(this.autocompleteActiveIndex + 1, this.filteredStocks.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.autocompleteActiveIndex = Math.max(this.autocompleteActiveIndex - 1, -1);
        break;
      case 'Enter':
        if (this.autocompleteActiveIndex >= 0 && this.autocompleteActiveIndex < this.filteredStocks.length) {
          this.onStockSelected(this.filteredStocks[this.autocompleteActiveIndex]);
          this.showAutocomplete = false;
        }
        break;
      case 'Escape':
        this.showAutocomplete = false;
        break;
    }
  }

  private setupAutoComplete(): void {
    this.searchForm.get('search')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 1) {
          this.isLoadingStocks = true;
          this.showAutocomplete = true;
          this.autocompleteActiveIndex = -1;
          
          // Usar el servicio de búsqueda de acciones
          return this.stocksService.searchStocks(value).pipe(
            catchError(error => {
              console.error('Error buscando acciones:', error);
              return of([]);
            }),
            map(results => {
              this.isLoadingStocks = false;
              if (Array.isArray(results)) {
                return results.slice(0, 10); // Limitar a 10 resultados
              }
              return [];
            })
          );
        }
        return of([]);
      })
    ).subscribe(stocks => {
      this.filteredStocks = stocks;
      this.isLoadingStocks = false;
    });
  }

  loadClientPortfolio(): void {
    this.isLoadingPortfolio = true;
    this.portfolioError = null;
    
    // En producción, llamar al servicio real que obtiene el portafolio del cliente
    this.portfolioService.getClientPortfolio(this.data.clientId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (portfolio) => {
        this.clientPortfolio = portfolio;
        this.isLoadingPortfolio = false;
      },
      error: (err) => {
        console.error('Error al cargar el portafolio del cliente:', err);
        this.portfolioError = 'No se pudo cargar la cartera del cliente. Por favor, inténtelo de nuevo.';
        this.isLoadingPortfolio = false;
      }
    });
  }

  onStockSelected(stock: any): void {
    this.selectedStock = stock;
    // Actualizar el campo de búsqueda con el símbolo de la acción seleccionada
    this.searchForm.get('search')?.setValue(stock.symbol, { emitEvent: false });
    // Cerrar el autocompletado
    this.showAutocomplete = false;
    // Remover el foco del input para mejor experiencia de usuario
    this.searchInput?.nativeElement.blur();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.selectedStock) {
      this.dialogRef.close({
        stock: this.selectedStock,
        action: this.data.action
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
}
