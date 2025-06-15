import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { CommissionerService } from '../services/commissioner.service';
import { 
  CommissionerClient, 
  ClientKpi, 
  CommissionSummary, 
  CommissionerStats, 
  CommissionerFilters 
} from '../models/commissioner.model';

// Tipo para las gráficas
export type ChartOptions = {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  colors: any[];
  labels: any[];
  title: any;
  subtitle: any;
  theme: any;
  plotOptions: any;
  tooltip: any;
  dataLabels: any;
  legend: any;
  stroke: any;
  fill: any;
  grid: any;
};

@Component({
  selector: 'app-commissioner-panel',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    RouterModule,
    NgApexchartsModule
  ],
  templateUrl: './commissioner-panel.component.html',
  styleUrls: ['./commissioner-panel.component.css']
})
export class CommissionerPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  // Variables para clientes
  displayedColumns: string[] = ['name', 'email', 'registration_date', 'status', 'total_investment', 'roi_percentage', 'last_operation_date', 'actions'];
  dataSource = new MatTableDataSource<CommissionerClient>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Variables para comisiones
  displayedColumnsCommissions: string[] = ['client_name', 'month', 'year', 'commissions_generated', 'operations_count', 'market', 'status', 'actions'];
  dataSourceCommissions = new MatTableDataSource<CommissionSummary>([]);
  @ViewChild('commissionsPaginator') commissionsPaginator!: MatPaginator;
  @ViewChild('commissionsSort') commissionsSort!: MatSort;
  
  // Variables para estadísticas
  commissionerStats!: CommissionerStats;
  
  // Gráficos
  clientDistributionChartOptions!: Partial<ChartOptions>;
  commissionsByMarketChartOptions!: Partial<ChartOptions>;
  commissionsTrendChartOptions!: Partial<ChartOptions>;
  roiDistributionChartOptions!: Partial<ChartOptions>;
  
  // Estado de la UI
  isLoading = true;
  isLoadingStats = true;
  isLoadingCommissions = true;
  error: string | null = null;
  
  // Filtros
  filterForm!: FormGroup;
  
  // Markets disponibles para filtrado
  markets: {value: string, label: string}[] = [
    { value: '', label: 'Todos los mercados' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'LATAM', label: 'Latinoamérica' },
    { value: 'EU', label: 'Europa' },
    { value: 'ASIA', label: 'Asia' }
  ];
  
  // Estados de cliente disponibles para filtrado
  statuses: {value: string, label: string}[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' }
  ];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private commissionerService: CommissionerService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.createFilterForm();
  }
  
  ngOnInit(): void {
    // Detectar cambios de tema
    this.setupThemeObserver();
    
    // Cargar datos iniciales
    this.loadData();
    
    // Configurar gráficos
    this.initCharts();
    
    // Suscribirse a cambios en filtros
    this.setupFilterListeners();
  }
  
  ngAfterViewInit(): void {
    // Configurar paginadores y ordenadores después de que las vistas se inicialicen
    this.configureDataTable();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(forceRefresh = false): void {
    this.isLoading = true;
    this.error = null;
    
    // Obtener filtros actuales
    const filters: CommissionerFilters = this.getFiltersFromForm();
    
    // Cargar reporte completo
    this.commissionerService.getCommissionerReport(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.processClientData(response.data.clients);
            this.processCommissionData(response.data.commissions);
            this.processStatsData(response.data.statistics);
            this.updateCharts();
          } else {
            this.error = 'No se pudieron cargar los datos. Intente nuevamente.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar datos:', err);
          this.error = 'Ocurrió un error al cargar los datos. Intente nuevamente.';
          this.isLoading = false;
        }
      });
  }
  
  private createFilterForm(): void {
    this.filterForm = this.fb.group({
      client_name: [''],
      market: [''],
      status: [''],
      date_range: this.fb.group({
        start: [null],
        end: [null]
      })
    });
  }
  
  private getFiltersFromForm(): CommissionerFilters {
    const formValue = this.filterForm.value;
    const filters: CommissionerFilters = {};
    
    if (formValue.client_name) {
      filters.client_name = formValue.client_name;
    }
    
    if (formValue.market) {
      filters.market = formValue.market;
    }
    
    if (formValue.status) {
      filters.status = formValue.status;
    }
    
    if (formValue.date_range?.start && formValue.date_range?.end) {
      filters.date_range = {
        start: formValue.date_range.start,
        end: formValue.date_range.end
      };
    }
    
    return filters;
  }
  
  private processClientData(clients: CommissionerClient[]): void {
    this.dataSource.data = clients;
  }
  
  private processCommissionData(commissions: CommissionSummary[]): void {
    this.dataSourceCommissions.data = commissions;
  }
  
  private processStatsData(stats: CommissionerStats): void {
    this.commissionerStats = stats;
  }
  
  private configureDataTable(): void {
    // Configurar tabla de clientes
    if(this.dataSource && this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    
    // Configurar tabla de comisiones
    if(this.dataSourceCommissions && this.commissionsPaginator && this.commissionsSort) {
      this.dataSourceCommissions.paginator = this.commissionsPaginator;
      this.dataSourceCommissions.sort = this.commissionsSort;
    }
  }
  
  private setupFilterListeners(): void {
    // Aplicar filtros automáticamente al cambiar los valores
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500) // Esperar 500ms después de que el usuario deje de escribir
      )
      .subscribe(() => {
        this.loadData();
      });
  }
  
  onFilterSubmit(): void {
    this.loadData(true);
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      client_name: '',
      market: '',
      status: '',
      date_range: {
        start: null,
        end: null
      }
    });
    this.loadData(true);
  }
  
  viewClientDetails(client: any): void {
    // Navegamos a la vista de detalle del cliente
    const clientId = client.id || client.client_id;
    if (clientId) {
      this.router.navigate(['/commissioner-panel/client', clientId]);
    } else {
      this.snackBar.open('No se pudo encontrar el ID del cliente', 'Cerrar', {
        duration: 3000
      });
    }
  }
  
  viewClientReport(clientId: number, clientName: string): void {
    // Navegamos a la vista de detalle del cliente pasando el id
    this.router.navigate(['/commissioner-panel/client', clientId]);
  }
  
  exportData(format: 'csv' | 'pdf' | 'excel'): void {
    const filters = this.getFiltersFromForm();
    this.commissionerService.exportReport(format, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          // Crear URL del blob y descargarlo
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte_comisionista_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          
          this.snackBar.open(`Reporte exportado en formato ${format.toUpperCase()}`, 'Cerrar', {
            duration: 3000
          });
        },
        error: (err) => {
          console.error('Error al exportar datos:', err);
          this.snackBar.open('Error al exportar datos', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  private initCharts(): void {
    this.clientDistributionChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 300
        }
      },
      colors: ['#10B981', '#F59E0B', '#EF4444'],
      labels: ['Activos', 'Pendientes', 'Inactivos'],
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return Math.round(val) + '%';
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '55%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: function(w: any) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        labels: {
          colors: ['#333', '#333', '#333']
        }
      }
    };

    this.commissionsByMarketChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 300
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 4
        },
      },
      colors: ['#10B981'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: ['#333', '#333', '#333', '#333']
          }
        }
      },
      yaxis: {
        title: {
          text: 'Comisiones ($)'
        },
        labels: {
          formatter: function(val: number) {
            return '$' + val.toFixed(0);
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return '$ ' + val.toFixed(2);
          }
        }
      }
    };
    
    // Configurar más gráficos aquí
  }
  
  private updateCharts(): void {
    if (this.commissionerStats) {
      // Actualizar gráfico de distribución de clientes
      if (this.clientDistributionChartOptions && this.clientDistributionChartOptions.series) {
        this.clientDistributionChartOptions.series = [
          this.commissionerStats.active_clients,
          (this.commissionerStats.total_clients - this.commissionerStats.active_clients - this.commissionerStats.clients_with_negative_roi),
          this.commissionerStats.clients_with_negative_roi
        ];
      }
      
      // Actualizar gráfico de comisiones por mercado
      if (this.commissionsByMarketChartOptions && this.commissionsByMarketChartOptions.series) {
        const marketAmounts = this.commissionerStats.commissions_by_market.map(m => m.amount);
        const marketLabels = this.commissionerStats.commissions_by_market.map(m => m.market);
        
        this.commissionsByMarketChartOptions.series = [{
          name: 'Comisiones',
          data: marketAmounts
        }];
        
        if (this.commissionsByMarketChartOptions.xaxis) {
          this.commissionsByMarketChartOptions.xaxis.categories = marketLabels;
        }
      }
      
      // Actualizar más gráficos aquí
    }
  }
  
  private setupThemeObserver(): void {
    // Observar cambios en el tema (claro/oscuro)
    const observer = new MutationObserver(() => {
      const isDarkTheme = document.documentElement.classList.contains('dark');
      this.updateChartsTheme(isDarkTheme);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Configurar tema inicial
    const isDarkTheme = document.documentElement.classList.contains('dark');
    this.updateChartsTheme(isDarkTheme);
  }
  
  private updateChartsTheme(isDarkTheme: boolean): void {
    // Actualizar colores de los gráficos según el tema
    const textColor = isDarkTheme ? '#E2E8F0' : '#333333';
    const gridColor = isDarkTheme ? '#374151' : '#E5E7EB';
    
    // Actualizar el gráfico de distribución de clientes
    if (this.clientDistributionChartOptions && this.clientDistributionChartOptions.legend) {
      this.clientDistributionChartOptions.legend.labels = {
        colors: [textColor, textColor, textColor]
      };
      this.clientDistributionChartOptions.theme = {
        mode: isDarkTheme ? 'dark' : 'light'
      };
    }
    
    // Actualizar el gráfico de comisiones por mercado
    if (this.commissionsByMarketChartOptions) {
      if (this.commissionsByMarketChartOptions.xaxis && this.commissionsByMarketChartOptions.xaxis.labels) {
        this.commissionsByMarketChartOptions.xaxis.labels.style = {
          colors: [textColor, textColor, textColor, textColor, textColor]
        };
      }
      
      if (this.commissionsByMarketChartOptions.yaxis && this.commissionsByMarketChartOptions.yaxis.title) {
        this.commissionsByMarketChartOptions.yaxis.title.style = {
          color: textColor
        };
      }
      
      this.commissionsByMarketChartOptions.grid = {
        borderColor: gridColor
      };
      
      this.commissionsByMarketChartOptions.theme = {
        mode: isDarkTheme ? 'dark' : 'light'
      };
    }
    
    // Actualizar más gráficos aquí
    
    // Forzar actualización de los gráficos
    this.cdr.detectChanges();
  }
  
  // Helper para formatear fechas
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
  
  // Helper para obtener clase de estado
  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
  
  // Helper para obtener texto de estado en español
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  }
  
  // Helper para formatear valores monetarios
  formatCurrency(value: number): string {
    return value?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) || '$0';
  }
  
  // Helper para formatear porcentajes
  formatPercentage(value: number): string {
    return value?.toFixed(2) + '%' || '0%';
  }
  
  /**
   * Verifica si hay filtros activos actualmente
   * @returns booleano que indica si hay al menos un filtro activo
   */
  hasActiveFilters(): boolean {
    const filters = this.getFiltersFromForm();
    return !!(filters.client_name || filters.market || filters.status || 
              (filters.date_range?.start || filters.date_range?.end));
  }
}
