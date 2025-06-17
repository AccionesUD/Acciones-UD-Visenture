import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CommissionerService } from '../../services/commissioner.service';
import { 
  CommissionerClient, 
  ClientKpi, 
  CommissionSummary
} from '../../models/commissioner.model';

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
  selector: 'app-client-report',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './client-report.component.html',
  styleUrls: ['./client-report.component.css']
})
export class ClientReportComponent implements OnInit, OnDestroy, AfterViewInit {
  // Variables para clientes
  clientId: number = 0;
  client!: CommissionerClient;
  clientKpis!: ClientKpi;
  
  // Variables para comisiones
  displayedColumnsCommissions: string[] = ['month', 'year', 'commissions_generated', 'operations_count', 'market', 'status'];
  dataSourceCommissions = new MatTableDataSource<CommissionSummary>([]);
  @ViewChild(MatPaginator) commissionsPaginator!: MatPaginator;
  @ViewChild(MatSort) commissionsSort!: MatSort;
  
  // Gráficos
  commissionsTrendChartOptions!: Partial<ChartOptions>;
  assetDistributionChartOptions!: Partial<ChartOptions>;
  roiTrendChartOptions!: Partial<ChartOptions>;
  
  // Estados de carga y error
  isLoading: boolean = true;
  error: string = '';
  
  // Filtros
  filterForm!: FormGroup;
  
  // Unsubscribe
  private destroy$ = new Subject<void>();

  // Periodos para filtro
  periods = [
    { label: 'Último mes', value: '1' },
    { label: 'Últimos 3 meses', value: '3' },
    { label: 'Últimos 6 meses', value: '6' },
    { label: 'Último año', value: '12' },
    { label: 'Todo', value: 'all' }
  ];

  // Mercados
  markets = [
    { label: 'Todos', value: '' },
    { label: 'USA', value: 'usa' },
    { label: 'Europa', value: 'europe' },
    { label: 'Asia', value: 'asia' },
    { label: 'Latinoamérica', value: 'latam' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private commissionerService: CommissionerService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      period: ['3'],
      market: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.clientId = +params['id'];
      
      if (this.clientId) {
        this.loadClientData();
      } else {
        this.handleError('Cliente no encontrado');
        this.router.navigate(['/commissioner-panel']);
      }
    });

    // Filtros en vivo
    this.setupFilterListeners();
    
    // Configurar observador para cambios de tema
    this.setupThemeObserver();
  }
  
  /**
   * Configura los listeners para los filtros en vivo
   * Cada cambio en un filtro ejecuta la búsqueda con un pequeño retraso
   */
  private setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$), 
        debounceTime(300), 
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        if (this.commissionsPaginator) {
          this.commissionsPaginator.pageIndex = 0; // Reset paginator to first page on filter change
        }
        this.applyFilters();
      });
  }

  ngAfterViewInit(): void {
    // Asegurar que los gráficos se rendericen correctamente después de que la vista esté inicializada
    setTimeout(() => {
      this.configureDataTable();
      this.cdr.detectChanges();
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura la tabla de datos, paginación y ordenación
   */
  private configureDataTable(): void {
    if (this.dataSourceCommissions && this.commissionsPaginator && this.commissionsSort) {
      this.dataSourceCommissions.paginator = this.commissionsPaginator;
      this.dataSourceCommissions.sort = this.commissionsSort;
    }
  }

  loadClientData(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.error = '';

    // Cargar datos del cliente
    this.commissionerService.getAssignedClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          const foundClient = clients.find(c => c.id === this.clientId);
          if (foundClient) {
            this.client = foundClient;
            this.loadClientKpis();
          } else {
            this.handleError('Cliente no encontrado');
            this.router.navigate(['/commissioner-panel']);
          }
        },
        error: (err) => {
          this.handleError('Error al cargar datos del cliente');
          console.error(err);
        }
      });
  }

  loadClientKpis(): void {
    // Cargar KPIs del cliente
    this.commissionerService.getClientKpis(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kpis) => {
          this.clientKpis = kpis;
          this.loadCommissions();
        },
        error: (err) => {
          this.handleError('Error al cargar KPIs del cliente');
          console.error(err);
        }
      });
  }

  loadCommissions(): void {
    // Cargar comisiones del cliente
    this.commissionerService.getClientCommissions(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commissions) => {
          this.dataSourceCommissions.data = commissions;
          this.configureDataTable();
          this.setupCharts();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.handleError('Error al cargar comisiones del cliente');
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  setupCharts(): void {
    // Configurar gráfico de tendencia de comisiones
    this.setupCommissionsTrendChart();
    
    // Configurar gráfico de distribución de activos
    this.setupAssetDistributionChart();
    
    // Configurar gráfico de tendencia de ROI
    this.setupRoiTrendChart();
  }

  setupCommissionsTrendChart(): void {
    const commissions = this.dataSourceCommissions.data;
    const months: string[] = [];
    const values: number[] = [];

    // Agrupar por mes-año y ordenar cronológicamente
    const monthlyCommissions = commissions.reduce((acc: any, curr) => {
      const key = `${curr.year}-${curr.month}`;
      if (!acc[key]) {
        acc[key] = {
          month: curr.month,
          year: curr.year,
          amount: 0,
          label: `${curr.month}/${curr.year}`
        };
      }
      acc[key].amount += curr.commissions_generated;
      return acc;
    }, {});

    // Convertir a array y ordenar
    const sortedData = Object.values(monthlyCommissions)
      .sort((a: any, b: any) => {
        return a.year === b.year 
          ? this.getMonthNumber(a.month) - this.getMonthNumber(b.month) 
          : a.year - b.year;
      });

    // Extraer datos para el gráfico
    sortedData.forEach((item: any) => {
      months.push(item.label);
      values.push(item.amount);
    });

    this.commissionsTrendChartOptions = {
      series: [
        {
          name: "Comisiones",
          data: values
        }
      ],
      chart: {
        type: "area",
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 3
      },
      colors: ['#10b981'],
      title: {
        text: "Evolución de Comisiones",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#334155'
        }
      },
      subtitle: {
        text: "Comisiones mensuales del cliente",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#64748b'
        }
      },
      xaxis: {
        categories: months,
        title: {
          text: "Período",
          style: {
            fontFamily: 'Inter, sans-serif',
            color: '#64748b'
          }
        },
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: '#64748b'
          }
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: "Comisiones ($)",
          style: {
            fontFamily: 'Inter, sans-serif',
            color: '#64748b'
          }
        },
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: '#64748b'
          },
          formatter: (value: number) => { return `$${value.toFixed(2)}` }
        }
      },
      tooltip: {
        x: {
          format: "MM/yy"
        },
        y: {
          formatter: (value: number) => { return `$${value.toFixed(2)}` }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        }
      }
    };
  }

  setupAssetDistributionChart(): void {
    if (!this.clientKpis || !this.clientKpis.main_assets || this.clientKpis.main_assets.length === 0) {
      return;
    }

    const assets = this.clientKpis.main_assets;
    const labels = assets.map(asset => asset.symbol);
    const data = assets.map(asset => asset.percentage);
    
    this.assetDistributionChartOptions = {
      series: data,
      chart: {
        type: "pie",
        height: 320,
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      labels: labels,
      colors: ['#10b981', '#3b82f6', '#6366f1', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b'],
      title: {
        text: "Distribución de Activos",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#334155'
        }
      },
      subtitle: {
        text: "Porcentaje de inversiones por activo",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#64748b'
        }
      },
      legend: {
        position: "bottom",
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        markers: {
          width: 10,
          height: 10
        },
        offsetY: 5
      },
      dataLabels: {
        formatter: (val: number) => { return val.toFixed(1) + '%' }
      },
      tooltip: {
        y: {
          formatter: (val: number) => { return val.toFixed(1) + '%' }
        }
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: '55%',
            labels: {
              show: false,
            }
          }
        }
      }
    };
  }

  setupRoiTrendChart(): void {
    // Datos simulados para la tendencia ROI (en un caso real, vendrían de la API)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const roi = [1.2, 2.3, 2.8, 2.1, 3.5, 4.2, 3.8, 4.5, 5.1, 5.8, 6.2, 6.9];
    const benchmark = [1.0, 1.5, 2.0, 1.8, 2.5, 3.0, 2.8, 3.2, 3.5, 3.8, 4.1, 4.5];
    
    this.roiTrendChartOptions = {
      series: [
        {
          name: "ROI Cliente",
          data: roi
        },
        {
          name: "Benchmark",
          data: benchmark
        }
      ],
      chart: {
        type: "line",
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        background: 'transparent',
        fontFamily: 'Inter, sans-serif'
      },
      stroke: {
        width: [3, 2],
        curve: "smooth",
        dashArray: [0, 5]
      },
      colors: ['#10b981', '#6366f1'],
      title: {
        text: "Evolución del ROI vs Benchmark",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#334155'
        }
      },
      subtitle: {
        text: "Comparativa de rendimiento anual",
        align: "left",
        style: {
          fontFamily: 'Inter, sans-serif',
          color: '#64748b'
        }
      },
      xaxis: {
        categories: months,
        title: {
          text: "Mes",
          style: {
            fontFamily: 'Inter, sans-serif',
            color: '#64748b'
          }
        },
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: '#64748b'
          }
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: "ROI (%)",
          style: {
            fontFamily: 'Inter, sans-serif',
            color: '#64748b'
          }
        },
        labels: {
          style: {
            fontFamily: 'Inter, sans-serif',
            colors: '#64748b'
          },
          formatter: (value: number) => { return `${value.toFixed(1)}%` }
        }
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        markers: {
          width: 10,
          height: 10
        },
        offsetY: -10
      },
      tooltip: {
        y: {
          formatter: (value: number) => { return `${value.toFixed(2)}%` }
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        }
      }
    };
  }

  /**
   * Configura un observador para detectar cambios en el tema (claro/oscuro)
   */
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
  
  /**
   * Actualiza el tema de todos los gráficos según el modo claro/oscuro
   */
  private updateChartsTheme(isDarkTheme: boolean): void {
    // Actualizar colores y estilos para modo claro/oscuro
    const textColor = isDarkTheme ? '#e2e8f0' : '#334155';
    const subtitleColor = isDarkTheme ? '#94a3b8' : '#64748b';
    const gridColor = isDarkTheme ? '#334155' : '#f1f5f9';
    const backgroundColor = isDarkTheme ? 'transparent' : 'transparent';
    
    // Comisiones Trend Chart
    if (this.commissionsTrendChartOptions) {
      // Actualizar título y estilos
      if (this.commissionsTrendChartOptions.title) {
        this.commissionsTrendChartOptions.title.style = {
          fontFamily: 'Inter, sans-serif',
          color: textColor
        };
      }
      
      if (this.commissionsTrendChartOptions.subtitle) {
        this.commissionsTrendChartOptions.subtitle.style = {
          fontFamily: 'Inter, sans-serif',
          color: subtitleColor
        };
      }
      
      // Actualizar ejes
      if (this.commissionsTrendChartOptions.xaxis) {
        this.commissionsTrendChartOptions.xaxis.labels = {
          ...this.commissionsTrendChartOptions.xaxis.labels,
          style: { colors: textColor }
        };
        
        if (this.commissionsTrendChartOptions.xaxis.title) {
          this.commissionsTrendChartOptions.xaxis.title.style = {
            fontFamily: 'Inter, sans-serif',
            color: subtitleColor
          };
        }
      }
      
      if (this.commissionsTrendChartOptions.yaxis) {
        this.commissionsTrendChartOptions.yaxis.labels = {
          ...this.commissionsTrendChartOptions.yaxis.labels,
          style: { colors: textColor }
        };
        
        if (this.commissionsTrendChartOptions.yaxis.title) {
          this.commissionsTrendChartOptions.yaxis.title.style = {
            fontFamily: 'Inter, sans-serif',
            color: subtitleColor
          };
        }
      }
      
      // Actualizar grilla
      this.commissionsTrendChartOptions.grid = {
        ...this.commissionsTrendChartOptions.grid,
        borderColor: gridColor
      };
      
      // Aplicar tema
      this.commissionsTrendChartOptions.chart = {
        ...this.commissionsTrendChartOptions.chart,
        background: backgroundColor,
        foreColor: textColor
      };
      
      this.commissionsTrendChartOptions.theme = {
        mode: isDarkTheme ? 'dark' : 'light'
      };
    }
    
    // Asset Distribution Chart
    if (this.assetDistributionChartOptions) {
      // Actualizar título y estilos
      if (this.assetDistributionChartOptions.title) {
        this.assetDistributionChartOptions.title.style = {
          fontFamily: 'Inter, sans-serif',
          color: textColor
        };
      }
      
      if (this.assetDistributionChartOptions.subtitle) {
        this.assetDistributionChartOptions.subtitle.style = {
          fontFamily: 'Inter, sans-serif',
          color: subtitleColor
        };
      }
      
      // Actualizar leyenda
      if (this.assetDistributionChartOptions.legend) {
        this.assetDistributionChartOptions.legend.labels = {
          colors: textColor
        };
      }
      
      // Aplicar tema
      this.assetDistributionChartOptions.chart = {
        ...this.assetDistributionChartOptions.chart,
        background: backgroundColor,
        foreColor: textColor
      };
      
      this.assetDistributionChartOptions.theme = {
        mode: isDarkTheme ? 'dark' : 'light'
      };
    }
    
    // ROI Trend Chart
    if (this.roiTrendChartOptions) {
      // Actualizar título y estilos
      if (this.roiTrendChartOptions.title) {
        this.roiTrendChartOptions.title.style = {
          fontFamily: 'Inter, sans-serif',
          color: textColor
        };
      }
      
      if (this.roiTrendChartOptions.subtitle) {
        this.roiTrendChartOptions.subtitle.style = {
          fontFamily: 'Inter, sans-serif',
          color: subtitleColor
        };
      }
      
      // Actualizar ejes
      if (this.roiTrendChartOptions.xaxis) {
        this.roiTrendChartOptions.xaxis.labels = {
          ...this.roiTrendChartOptions.xaxis.labels,
          style: { colors: textColor }
        };
        
        if (this.roiTrendChartOptions.xaxis.title) {
          this.roiTrendChartOptions.xaxis.title.style = {
            fontFamily: 'Inter, sans-serif',
            color: subtitleColor
          };
        }
      }
      
      if (this.roiTrendChartOptions.yaxis) {
        this.roiTrendChartOptions.yaxis.labels = {
          ...this.roiTrendChartOptions.yaxis.labels,
          style: { colors: textColor }
        };
        
        if (this.roiTrendChartOptions.yaxis.title) {
          this.roiTrendChartOptions.yaxis.title.style = {
            fontFamily: 'Inter, sans-serif',
            color: subtitleColor
          };
        }
      }
      
      // Actualizar leyenda
      if (this.roiTrendChartOptions.legend) {
        this.roiTrendChartOptions.legend.labels = {
          colors: textColor
        };
      }
      
      // Actualizar grilla
      this.roiTrendChartOptions.grid = {
        ...this.roiTrendChartOptions.grid,
        borderColor: gridColor
      };
      
      // Aplicar tema
      this.roiTrendChartOptions.chart = {
        ...this.roiTrendChartOptions.chart,
        background: backgroundColor,
        foreColor: textColor
      };
      
      this.roiTrendChartOptions.theme = {
        mode: isDarkTheme ? 'dark' : 'light'
      };
    }
    
    // Forzar actualización de los gráficos
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Aplicar filtros a las comisiones
    let filteredData = this.dataSourceCommissions.data;
    
    // Filtro por mercado
    if (filters.market) {
      filteredData = filteredData.filter(item => item.market.toLowerCase() === filters.market.toLowerCase());
    }
    
    // Filtro por período
    if (filters.period && filters.period !== 'all') {
      const months = parseInt(filters.period);
      const dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - months);
      
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.year, this.getMonthNumber(item.month) - 1, 1);
        return itemDate >= dateLimit;
      });
    }
    
    // Filtro por estado
    if (filters.status) {
      filteredData = filteredData.filter(item => item.status === filters.status);
    }
    
    // Actualizar dataSource
    this.dataSourceCommissions.data = filteredData;
    
    // Actualizar gráficos
    this.setupCharts();
  }

  /**
   * Verifica si hay filtros activos actualmente
   * @returns booleano que indica si hay al menos un filtro activo
   */
  hasActiveFilters(): boolean {
    const filters = this.filterForm.value;
    return !!(
      (filters.period && filters.period !== 'all') || 
      filters.market || 
      filters.status
    );
  }

  getMonthNumber(month: string): number {
    const months: { [key: string]: number } = {
      'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12
    };
    return months[month] || 1;
  }

  // Funciones de utilidad
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'paid': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
  
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'paid': 'Pagado'
    };
    
    return statusLabels[status] || status;
  }

  exportData(format: 'pdf' | 'excel'): void {
    // Implementar lógica de exportación
    this.snackBar.open(`Exportando reporte en formato ${format.toUpperCase()}...`, 'OK', {
      duration: 3000
    });
  }

  goBack(): void {
    this.router.navigate(['/commissioner-panel']);
  }

  handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
  }
}
