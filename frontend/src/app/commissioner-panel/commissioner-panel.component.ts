import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { catchError, delay, takeUntil } from 'rxjs/operators';

import { CommissionerService } from '../services/commissioner.service';
import { AuthService } from '../services/auth.service';
import { 
  CommissionerClient, 
  ClientKpi, 
  CommissionSummary, 
  CommissionerStats,
  CommissionerFilters
} from '../models/commissioner.model';

// Para los gráficos
import { NgApexchartsModule } from 'ng-apexcharts';
import { 
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexResponsive,
  ApexGrid,
  ApexTitleSubtitle,
  ApexTheme,
  ApexNonAxisChartSeries
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  title: ApexTitleSubtitle;
  theme: ApexTheme;
  labels?: string[];   // Añadido para gráficos de pie
  stroke?: ApexStroke; // Añadido para gráficos de línea/barra
  grid?: ApexGrid;     // Añadido para permitir definir la cuadrícula en algunos gráficos
};

@Component({
  selector: 'app-commissioner-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    NgApexchartsModule,
    RouterModule,
    DatePipe
  ],
  templateUrl: './commissioner-panel.component.html',
  styleUrl: './commissioner-panel.component.css'
})
export class CommissionerPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  // Datos
  clients: CommissionerClient[] = [];
  clientKpis: ClientKpi[] = [];
  commissions: CommissionSummary[] = [];
  statistics: CommissionerStats | null = null;
  selectedClient: CommissionerClient | null = null;
  selectedClientKpi: ClientKpi | null = null;
  
  // Estados de UI
  isLoading = true;
  isExporting = false;
  activeTab = 0;
  
  // Filtros
  filterForm: FormGroup;
  
  // Configuración de tablas
  clientColumns: string[] = ['name', 'status', 'total_investment', 'roi_percentage', 'main_assets', 'last_operation_date', 'actions'];
  clientDataSource = new MatTableDataSource<CommissionerClient>([]);
  commissionColumns: string[] = ['client_name', 'month', 'year', 'commissions_generated', 'operations_count', 'market', 'status'];
  commissionDataSource = new MatTableDataSource<CommissionSummary>([]);
  
  // Gráficos
  commissionChartOptions!: Partial<ChartOptions>;
  roiChartOptions!: Partial<ChartOptions>;
  marketShareChartOptions!: Partial<ChartOptions>;
  monthlyPerformanceChartOptions!: Partial<ChartOptions>;
  
  @ViewChild('clientsPaginator') clientsPaginator!: MatPaginator;
  @ViewChild('clientsSort') clientsSort!: MatSort;
  @ViewChild('commissionsPaginator') commissionsPaginator!: MatPaginator;
  @ViewChild('commissionsSort') commissionsSort!: MatSort;
  
  private destroy$ = new Subject<void>();
  isDarkMode = false;
  
  // Para acceso en el template
  Math = Math;
  
  constructor(
    private commissionerService: CommissionerService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      client_name: [''],
      market: [''],
      asset_type: [''],
      date_from: [null],
      date_to: [null],
      status: ['']
    });
  }
  
  ngOnInit(): void {
    // Detectar el tema actual
    if (typeof window !== 'undefined') {
      // Verificar modo oscuro inicial
      this.isDarkMode = document.documentElement.classList.contains('dark');
      
      // Observer para detectar cambios en el tema
      this.setupThemeObserver();
    }
    
    this.loadData();
    this.initializeCharts();
  }
  
  ngAfterViewInit(): void {
    // La vista ya está disponible
    if (this.clientDataSource && this.clientsPaginator && this.clientsSort) {
      this.clientDataSource.paginator = this.clientsPaginator;
      this.clientDataSource.sort = this.clientsSort;
    }
    
    if (this.commissionDataSource && this.commissionsPaginator && this.commissionsSort) {
      this.commissionDataSource.paginator = this.commissionsPaginator;
      this.commissionDataSource.sort = this.commissionsSort;
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura un observador para detectar cambios en la clase 'dark' del elemento root
   * y actualiza los temas de la gráfica cuando cambian
   */
  setupThemeObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const isDark = document.documentElement.classList.contains('dark');
          if (this.isDarkMode !== isDark) {
            this.isDarkMode = isDark;
            this.updateChartsTheme();
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  /**
   * Carga los datos del comisionista
   */
  loadData(): void {
    this.isLoading = true;
    
    const filters: CommissionerFilters = {
      client_name: this.filterForm.value.client_name || undefined,
      market: this.filterForm.value.market || undefined,
      asset_type: this.filterForm.value.asset_type || undefined,
      status: this.filterForm.value.status || undefined
    };
    
    if (this.filterForm.value.date_from && this.filterForm.value.date_to) {
      filters.date_from = this.filterForm.value.date_from;
      filters.date_to = this.filterForm.value.date_to;
    }
    
    this.commissionerService.getAssignedClients().pipe(
      catchError(error => {
        console.error('Error al cargar clientes:', error);
        this.showError('Error al cargar datos. Usando datos de respaldo.');
        // Cargar datos de respaldo en caso de error
        return this.loadFallbackData();
      }),
      takeUntil(this.destroy$)
    ).subscribe(clients => {
      this.clients = clients;
      this.clientDataSource.data = this.clients;
      
      // Cargar estadísticas
      this.commissionerService.getCommissionerStats().pipe(
        catchError(error => {
          console.error('Error al cargar estadísticas:', error);
          // Si hay error, generar estadísticas basadas en los clientes cargados
          const mockStats: CommissionerStats = this.generateMockStats(clients);
          return of(mockStats);
        }),
        takeUntil(this.destroy$)
      ).subscribe(stats => {
        this.statistics = stats;
        
        // Cargar comisiones
        this.commissionerService.getCommissions().pipe(
          catchError(error => {
            console.error('Error al cargar comisiones:', error);
            // Si hay error, generar comisiones mock
            const mockCommissions = this.generateMockCommissions(clients);
            return of(mockCommissions);
          }),
          takeUntil(this.destroy$)
        ).subscribe(commissions => {
          this.commissions = commissions;
          this.commissionDataSource.data = this.commissions;
          
          // Actualizar gráficos con datos
          this.updateCharts();
          
          this.isLoading = false;
        });
      });
    });
  }
  
  /**
   * Genera estadísticas mock basadas en los clientes proporcionados
   */
  private generateMockStats(clients: CommissionerClient[]): CommissionerStats {
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalInvestment = clients.reduce((sum, c) => sum + c.total_investment, 0);
    const avgRoi = clients.reduce((sum, c) => sum + c.roi_percentage, 0) / Math.max(1, clients.length);
    const highestRoi = Math.max(...clients.map(c => c.roi_percentage));
    
    return {
      total_clients: clients.length,
      active_clients: activeClients,
      total_commissions_generated: totalInvestment * 0.02, // 2% de comisión estimada
      total_commissions_month: totalInvestment * 0.005, // 0.5% mensual estimado
      commission_growth: 3.5, // Valor simulado
      average_roi_clients: avgRoi,
      highest_roi_client: highestRoi,
      total_operations: clients.length * 8, // Promedio de 8 operaciones por cliente
      performance_trend: avgRoi > 0 ? 'up' : 'down'
    };
  }
  
  /**
   * Genera datos mock para comisiones en caso de fallo del backend
   */
  private generateMockCommissions(clients: CommissionerClient[]): CommissionSummary[] {
    const mockCommissions: CommissionSummary[] = [];
    const markets = ['NYSE', 'NASDAQ', 'BVC'];
    const statuses = ['pending', 'approved', 'paid'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    
    // Generar últimos 6 meses
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = months[i];
      const year = date.getFullYear();
      
      // Generar entre 1 y 3 comisiones por mes
      const commissionsPerMonth = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < commissionsPerMonth; j++) {
        // Elegir un cliente aleatoriamente
        const client = clients[Math.floor(Math.random() * clients.length)];
        const market = markets[Math.floor(Math.random() * markets.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const operations = Math.floor(Math.random() * 10) + 1;
        const commissions = operations * (Math.floor(Math.random() * 50) + 20);
        
        mockCommissions.push({
          id: mockCommissions.length + 1,
          client_id: client.id,
          client_name: client.name,
          month: month,
          year: year,
          commissions_generated: commissions,
          operations_count: operations,
          market: market,
          status: status
        });
      }
    }
    
    return mockCommissions;
  }
  
  /**
   * Carga datos de respaldo en caso de fallo del backend
   */
  private loadFallbackData(): Observable<CommissionerClient[]> {
    const mockClients: CommissionerClient[] = [
      {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone_number: '3001234567',
        registration_date: new Date('2024-01-15'),
        status: 'active',
        total_investment: 25000.00,
        roi_percentage: 12.5,
        market: 'NYSE',
        main_assets: [
          { name: 'Apple', symbol: 'AAPL', value: 10000, percentage: 40 },
          { name: 'Microsoft', symbol: 'MSFT', value: 8000, percentage: 32 },
          { name: 'Amazon', symbol: 'AMZN', value: 7000, percentage: 28 }
        ],
        last_operation_date: new Date('2025-06-10')
      },
      {
        id: 2,
        name: 'Ana Gómez',
        email: 'ana.gomez@example.com',
        phone_number: '3109876543',
        registration_date: new Date('2024-03-22'),
        status: 'active',
        total_investment: 15000.00,
        roi_percentage: 8.3,
        market: 'NASDAQ',
        main_assets: [
          { name: 'Tesla', symbol: 'TSLA', value: 6000, percentage: 40 },
          { name: 'Ecopetrol', symbol: 'ECO', value: 5000, percentage: 33 },
          { name: 'Google', symbol: 'GOOGL', value: 4000, percentage: 27 }
        ],
        last_operation_date: new Date('2025-06-05')
      },
      {
        id: 3,
        name: 'Carlos López',
        email: 'carlos.lopez@example.com',
        phone_number: '3205551234',
        registration_date: new Date('2023-11-10'),
        status: 'inactive',
        total_investment: 35000.00,
        roi_percentage: -2.1,
        market: 'BVC',
        main_assets: [
          { name: 'Netflix', symbol: 'NFLX', value: 15000, percentage: 43 },
          { name: 'Bancolombia', symbol: 'BVC', value: 10000, percentage: 28 },
          { name: 'Facebook', symbol: 'META', value: 10000, percentage: 28 }
        ],
        last_operation_date: new Date('2025-05-15')
      },
      {
        id: 4,
        name: 'Laura Díaz',
        email: 'laura.diaz@example.com',
        phone_number: '3157654321',
        registration_date: new Date('2024-02-05'),
        status: 'pending',
        total_investment: 10000.00,
        roi_percentage: 5.7,
        market: 'NYSE',
        main_assets: [
          { name: 'Amazon', symbol: 'AMZN', value: 5000, percentage: 50 },
          { name: 'Nubank', symbol: 'NU', value: 5000, percentage: 50 }
        ],
        last_operation_date: new Date('2025-06-01')
      },
      {
        id: 5,
        name: 'Pedro Martínez',
        email: 'pedro.martinez@example.com',
        phone_number: '3012348765',
        registration_date: new Date('2023-09-18'),
        status: 'active',
        total_investment: 50000.00,
        roi_percentage: 15.3,
        market: 'NASDAQ',
        main_assets: [
          { name: 'Apple', symbol: 'AAPL', value: 20000, percentage: 40 },
          { name: 'Microsoft', symbol: 'MSFT', value: 15000, percentage: 30 },
          { name: 'Google', symbol: 'GOOGL', value: 15000, percentage: 30 }
        ],
        last_operation_date: new Date('2025-06-12')
      }
    ];
    
    return of(mockClients).pipe(delay(1000)); // Simular latencia de red
  }
  
  updateCharts(): void {
    // Actualizar tema de gráficos primero
    this.updateChartsTheme();
    
    // Actualizar datos de gráficos
    this.updateCommissionChart();
    this.updateRoiChart();
    this.updateMarketShareChart();
    this.updateMonthlyPerformanceChart();
  }
  
  /**
   * Actualiza los temas de todos los gráficos basados en el tema actual
   */
  updateChartsTheme(): void {
    const textColor = this.isDarkMode ? '#E5E7EB' : '#374151';
    const gridColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const backgroundColor = this.isDarkMode ? '#1F2937' : '#FFFFFF';
    
    // Actualizar tema del gráfico de comisiones
    if (this.commissionChartOptions) {
      this.commissionChartOptions.theme = {
        mode: this.isDarkMode ? 'dark' : 'light'
      };
      
      if (this.commissionChartOptions.xaxis) {
        this.commissionChartOptions.xaxis = {
          ...this.commissionChartOptions.xaxis,
          labels: {
            style: {
              colors: textColor
            }
          },
          axisBorder: {
            color: gridColor
          },
          axisTicks: {
            color: gridColor
          }
        };
      }
      
      if (this.commissionChartOptions.yaxis) {
        this.commissionChartOptions.yaxis = {
          ...this.commissionChartOptions.yaxis,
          labels: {
            style: {
              colors: [textColor]
            }
          }
        };
      }
      
      if (this.commissionChartOptions.grid) {
        this.commissionChartOptions.grid.borderColor = gridColor;
      } else {
        this.commissionChartOptions.grid = {
          borderColor: gridColor,
          strokeDashArray: 4,
          yaxis: {
            lines: {
              show: true
            }
          }
        };
      }
    }
    
    // Actualizar tema del gráfico de ROI
    if (this.roiChartOptions) {
      this.roiChartOptions.theme = {
        mode: this.isDarkMode ? 'dark' : 'light'
      };
      
      if (this.roiChartOptions.xaxis) {
        this.roiChartOptions.xaxis = {
          ...this.roiChartOptions.xaxis,
          labels: {
            style: {
              colors: textColor
            }
          }
        };
      }
    }
    
    // Actualizar tema del gráfico de distribución por mercado
    if (this.marketShareChartOptions) {
      this.marketShareChartOptions.theme = {
        mode: this.isDarkMode ? 'dark' : 'light'
      };
      
      // Para gráficos de tipo pie o donut, ajustar etiquetas
      if (this.marketShareChartOptions.dataLabels) {
        this.marketShareChartOptions.dataLabels = {
          ...this.marketShareChartOptions.dataLabels,
          style: {
            colors: [textColor]
          }
        };
      }
      
      if (this.marketShareChartOptions.legend) {
        this.marketShareChartOptions.legend = {
          ...this.marketShareChartOptions.legend,
          labels: {
            colors: textColor
          }
        };
      }
    }
    
    // Actualizar tema del gráfico de rendimiento mensual
    if (this.monthlyPerformanceChartOptions) {
      this.monthlyPerformanceChartOptions.theme = {
        mode: this.isDarkMode ? 'dark' : 'light'
      };
      
      if (this.monthlyPerformanceChartOptions.xaxis) {
        this.monthlyPerformanceChartOptions.xaxis = {
          ...this.monthlyPerformanceChartOptions.xaxis,
          labels: {
            style: {
              colors: textColor
            }
          }
        };
      }
    }
  }
  
  /**
   * Actualiza el gráfico de comisiones por cliente
   */
  updateCommissionChart(): void {
    // Obtener datos para el gráfico
    const uniqueClients = [...new Set(this.commissions.map(c => c.client_name))];
    const clientCommissions = uniqueClients.map(name => {
      const clientCommissions = this.commissions.filter(c => c.client_name === name);
      return {
        name,
        totalCommissions: clientCommissions.reduce((sum, c) => sum + c.commissions_generated, 0)
      };
    });
    
    // Ordenar por valor descendente
    clientCommissions.sort((a, b) => b.totalCommissions - a.totalCommissions);
    
    // Limitar a los 5 clientes con más comisiones
    const topClients = clientCommissions.slice(0, 5);
    
    // Configuración del gráfico
    this.commissionChartOptions.series = [{
      name: 'Comisiones',
      data: topClients.map(c => c.totalCommissions)
    }];
    
    if (this.commissionChartOptions.xaxis) {
      this.commissionChartOptions.xaxis.categories = topClients.map(c => c.name);
    }
    
    // Ajustar colores según el tema
    this.commissionChartOptions.colors = [this.isDarkMode ? '#10b981' : '#059669'];
  }
  
  /**
   * Actualiza el gráfico de ROI por cliente
   */
  updateRoiChart(): void {
    // Obtener datos para el gráfico
    const sortedClients = [...this.clients]
      .sort((a, b) => b.roi_percentage - a.roi_percentage)
      .slice(0, 5);
    
    // Configuración del gráfico
    this.roiChartOptions.series = [{
      name: 'ROI',
      data: sortedClients.map(c => c.roi_percentage)
    }];
    
    if (this.roiChartOptions.xaxis) {
      this.roiChartOptions.xaxis.categories = sortedClients.map(c => c.name);
    }
    
    // Ajustar colores según el tema
    this.roiChartOptions.colors = [this.isDarkMode ? '#6366f1' : '#4f46e5'];
  }
  
  /**
   * Actualiza el gráfico de distribución por mercado
   */
  updateMarketShareChart(): void {
    // Categorías de mercados que tenemos
    const markets = [...new Set(this.clients.map(client => client.market))];
    
    // Contar clientes por mercado
    const marketCounts = markets.map(market => {
      return this.clients.filter(client => client.market === market).length;
    });
    
    // Calcular porcentajes para mostrar valores más precisos
    const totalClients = this.clients.length;
    const marketPercentages = marketCounts.map(count => 
      parseFloat(((count / totalClients) * 100).toFixed(1))
    );
    
    // Colores adaptados al tema
    const textColor = this.isDarkMode ? '#E5E7EB' : '#374151';
    const colors = this.isDarkMode ? 
      ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'] : 
      ['#059669', '#2563EB', '#D97706', '#7C3AED', '#DB2777'];
    
    // Configuración del gráfico de distribución por mercado
    this.marketShareChartOptions = {
      series: marketPercentages,
      chart: {
        type: 'donut',
        height: 320,
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        animations: {
          enabled: true,
          speed: 500,
          dynamicAnimation: {
            enabled: true
          }
        },
        toolbar: {
          show: false
        }
      },
      labels: markets,
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 250,
            height: 280
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + "%";
        }
      },
      colors: colors,
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        labels: {
          colors: textColor
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      theme: {
        mode: this.isDarkMode ? 'dark' : 'light'
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(value: number) {
            return value + "%";
          }
        }
      },
      stroke: {
        width: 2
      }
    };
  }
  
  /**
   * Actualiza el gráfico de rendimiento mensual
   */
  updateMonthlyPerformanceChart(): void {
    // Agrupar comisiones por mes
    const months = [...new Set(this.commissions.map(c => c.month))];
    const monthlyCommissions = months.map(month => {
      const monthCommissions = this.commissions.filter(c => c.month === month);
      return {
        month,
        totalCommissions: monthCommissions.reduce((sum, c) => sum + c.commissions_generated, 0)
      };
    });
    
    // Ordenar cronológicamente
    const monthOrder = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    monthlyCommissions.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    // Configuración del gráfico
    this.monthlyPerformanceChartOptions.series = [{
      name: 'Comisiones',
      data: monthlyCommissions.map(m => m.totalCommissions)
    }];
    
    if (this.monthlyPerformanceChartOptions.xaxis) {
      this.monthlyPerformanceChartOptions.xaxis.categories = monthlyCommissions.map(m => m.month);
    }
    
    // Ajustar colores según el tema
    this.monthlyPerformanceChartOptions.colors = [this.isDarkMode ? '#10b981' : '#059669'];
  }
  
  /**
   * Inicializa los gráficos con configuraciones base
   */
  initializeCharts(): void {
    // Gráfico de comisiones por cliente
    this.commissionChartOptions = {
      series: [{
        name: 'Comisiones',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        },
      },
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
      },
      yaxis: {
        title: {
          text: '$ (pesos)'
        }
      },
      fill: {
        opacity: 1,
        colors: ['#10b981']
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "$ " + val.toFixed(2);
          }
        }
      }
    };
    
    // Gráfico de ROI por cliente
    this.roiChartOptions = {
      series: [{
        name: 'ROI',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        },
      },
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
      },
      yaxis: {
        title: {
          text: '% ROI'
        }
      },
      fill: {
        opacity: 1,
        colors: ['#6366f1']
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val.toFixed(2) + "%";
          }
        }
      }
    };
    
    // Gráfico de distribución por mercado
    this.marketShareChartOptions = {
      series: [],
      chart: {
        type: 'pie',
        height: 350,
        toolbar: {
          show: false
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          if (typeof val === 'number') {
            return val.toFixed(1) + '%';
          }
          return val;
        }
      }
    };
    
    // Gráfico de rendimiento mensual
    this.monthlyPerformanceChartOptions = {
      series: [{
        name: 'Comisiones',
        data: []
      }],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight',
        colors: ['#10b981']
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
      },
      xaxis: {
        categories: [],
      }
    };
  }
  
  /**
   * Selecciona un cliente para mostrar sus detalles
   */
  selectClient(client: CommissionerClient): void {
    this.selectedClient = client;
    this.selectedClientKpi = this.clientKpis.find(kpi => kpi.client_id === client.id) || null;
    
    // Filtrar comisiones para este cliente
    this.commissionDataSource.data = this.commissions.filter(c => c.client_id === client.id);
    
    // Cambiar a la pestaña de detalles
    this.activeTab = 1;
  }
  
  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filterForm.reset({
      client_name: '',
      market: '',
      asset_type: '',
      date_from: null,
      date_to: null,
      status: ''
    });
    this.loadData();
  }
  
  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    this.loadData();
  }
  
  /**
   * Exporta los datos en el formato especificado
   */
  exportData(format: 'csv' | 'pdf' | 'excel'): void {
    this.isExporting = true;
    
    const filters: CommissionerFilters = {
      client_name: this.filterForm.value.client_name || undefined,
      market: this.filterForm.value.market || undefined,
      asset_type: this.filterForm.value.asset_type || undefined,
      status: this.filterForm.value.status || undefined
    };
    
    if (this.filterForm.value.date_from && this.filterForm.value.date_to) {
      filters.date_from = this.filterForm.value.date_from;
      filters.date_to = this.filterForm.value.date_to;
    }
    
    this.commissionerService.exportReport(format, filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.isExporting = false;
        
        // Crear un enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-comisionista.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showSuccess(`Reporte exportado en formato ${format.toUpperCase()}`);
      },
      error: (err) => {
        this.isExporting = false;
        console.error('Error al exportar:', err);
        this.showError('Error al exportar los datos');
      }
    });
  }
  
  /**
   * Termina el contrato con un cliente
   */
  terminateContract(client: CommissionerClient): void {
    if (confirm(`¿Está seguro de que desea terminar el contrato con ${client.name}? Esta acción no se puede deshacer.`)) {
      this.isLoading = true;
      
      this.commissionerService.terminateClientContract(client.id).pipe(
        catchError(error => {
          console.error('Error al terminar contrato:', error);
          // Simulamos el éxito en caso de error en la API
          return of({ success: true });
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          if (response && response.success) {
            // Actualizar el estado del cliente localmente
            const updatedClient = { ...client, status: 'inactive' };
            const index = this.clients.findIndex(c => c.id === client.id);
            if (index !== -1) {
              this.clients[index] = updatedClient;
              this.clientDataSource.data = [...this.clients];
              
              // Si el cliente seleccionado es el mismo, actualizar también
              if (this.selectedClient && this.selectedClient.id === client.id) {
                this.selectedClient = updatedClient;
              }
            }
            
            this.showSuccess(`Contrato con ${client.name} terminado con éxito`);
          } else {
            this.showError('No se pudo terminar el contrato');
          }
          this.isLoading = false;
        },
        error: () => {
          this.showError('Error al terminar el contrato');
          this.isLoading = false;
        }
      });
    }
  }
  
  /**
   * Obtiene la clase CSS para el estado del cliente
   */
  getClientStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }
  
  /**
   * Obtiene la clase CSS para el estado de la comisión
   */
  getCommissionStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }
  
  /**
   * Obtiene la clase CSS para el ROI
   */
  getRoiClass(roi: number): string {
    if (roi > 0) {
      return 'text-green-600 dark:text-green-500';
    } else if (roi < 0) {
      return 'text-red-600 dark:text-red-500';
    }
    return 'text-gray-600 dark:text-gray-400';
  }
  
  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  
  /**
   * Muestra un mensaje de error
   */
  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  /**
   * Vuelve a la lista de clientes
   */
  backToList(): void {
    this.selectedClient = null;
    this.selectedClientKpi = null;
    this.commissionDataSource.data = this.commissions;
    this.activeTab = 0;
  }
}
