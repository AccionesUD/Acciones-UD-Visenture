import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption, SortOption, PerformanceFilterOption } from '../../models/filters.model';


@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html'
})
export class FiltersComponent implements OnInit {
  @Input() marketFilters: FilterOption[] = [];
  @Output() filterChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<SortOption>();
  @Output() performanceFilterChange = new EventEmitter<PerformanceFilterOption>();

  // Valores iniciales por defecto
  selectedFilter: string = 'ALL';
  selectedSort: string = 'none';
  selectedPerformance: string = 'all';
  
  // Valores por defecto para reseteo
  private readonly DEFAULT_FILTER = 'ALL';
  private readonly DEFAULT_SORT = 'none';
  private readonly DEFAULT_PERFORMANCE = 'all';

  sortOptions: SortOption[] = [
    { label: 'Sin ordenar', value: 'none', direction: 'asc', property: '' },
    { label: 'Mayor valor', value: 'highest-value', direction: 'desc', property: 'totalValue' },
    { label: 'Menor valor', value: 'lowest-value', direction: 'asc', property: 'totalValue' },
    { label: 'Mayor ganancia', value: 'highest-gain', direction: 'desc', property: 'performance' },
    { label: 'Mayor pérdida', value: 'highest-loss', direction: 'asc', property: 'performance' }
  ];
  
  performanceFilters: PerformanceFilterOption[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Alto rendimiento (>5%)', value: 'high', min: 5 },
    { label: 'Rendimiento medio (0-5%)', value: 'medium', min: 0, max: 5 },
    { label: 'En pérdida (<0%)', value: 'loss', max: 0 }
  ];
  constructor() { }
  ngOnInit(): void {
    // Trigger initial filter states to ensure parent component is updated
    this.onFilterChange();
    this.onSortChange();
    this.onPerformanceFilterChange();
  }

  onFilterChange(): void {
    this.filterChange.emit(this.selectedFilter);
  }

  onSortChange(): void {
    const selectedSortOption = this.sortOptions.find(option => option.value === this.selectedSort);
    if (selectedSortOption) {
      this.sortChange.emit(selectedSortOption);
    }
  }
    onPerformanceFilterChange(): void {
    const selectedPerformanceOption = this.performanceFilters.find(option => option.value === this.selectedPerformance);
    if (selectedPerformanceOption) {
      this.performanceFilterChange.emit(selectedPerformanceOption);
    }
  }
  
  /**
   * Reinicia los selectores a sus valores por defecto
   */  resetAllFilters(): void {
    this.selectedFilter = this.DEFAULT_FILTER;
    this.selectedSort = this.DEFAULT_SORT;
    this.selectedPerformance = this.DEFAULT_PERFORMANCE;
    
    // Emitir eventos para informar al componente padre
    // Using the existing event handler methods to ensure consistency
    this.onFilterChange();
    this.onSortChange();
    this.onPerformanceFilterChange();
  }
}
