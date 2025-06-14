import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FiltersComponent } from './filters/filters.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { PortfolioSummary, Stock } from '../models/portfolio.model';
import { SortOption, PerformanceFilterOption } from '../models/filters.model';
import { PortfolioService } from '../services/portfolio.service';
import { CustomPaginatorIntl } from '../shared/custom-paginator-intl';

@Component({  
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    FiltersComponent, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatPaginatorModule
  ],  
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ]
})
export class PortfolioComponent implements OnInit {
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
    totalStocks: 0,
    totalValue: 0,
    performance: 0
  };
  constructor(private portfolioService: PortfolioService) {}  
  
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
    }
    
    // Simulamos una carga de datos
    this.isLoading = true;
    
    // Cargar datos mediante el servicio
    this.portfolioService.getPortfolioStocks().subscribe({
      next: (stocks) => {
        this.stocks = stocks;
        this.applyFilters(); // Aplica los filtros actuales
        this.updateDisplayedStocks(); // Actualiza las acciones que se muestran según la paginación
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar acciones', err);
        this.error = 'No se pudieron cargar las acciones. Intente nuevamente más tarde.';
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
  }

  updateDisplayedStocks(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.totalStocks = this.filteredStocks.length;
    this.displayedStocks = this.filteredStocks.slice(startIndex, startIndex + this.pageSize);
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
    if (sortOption.value === 'none') {
      // Si no hay ordenamiento, reaplicamos los filtros para restaurar el orden original
      this.applyFilters();
      return;
    }    this.filteredStocks.sort((a, b) => {
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
      if (sortOption.direction === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    // Actualizar las acciones mostradas después de ordenarlas
    this.updateDisplayedStocks();
  }

    private calculatePortfolioSummary(): void {
    const totalInvested = this.filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalEarnings = this.filteredStocks.reduce((sum, stock) => sum + (stock.totalValue * stock.performance / 100), 0);
    
    this.portfolioSummary = {
      totalInvested: totalInvested,
      totalEarnings: totalEarnings,
      totalStocks: this.filteredStocks.reduce((sum, stock) => sum + stock.quantity, 0),
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
}