import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';

import { CommissionerService } from '../../services/commissioner.service';
import { ClientKpi, CommissionSummary, CommissionerClient } from '../../models/commissioner.model';
import { Share } from '../../models/share.model';
import { Stock } from '../../models/stock.model';

// Importar ApexCharts para gráficos avanzados
import { 
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexXAxis,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexTitleSubtitle,
  ApexNonAxisChartSeries,
  ApexTheme,
  NgApexchartsModule
} from "ng-apexcharts";

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
  stroke?: any;        // Opcional para gráficos de línea/barra
  labels?: string[];   // Opcional para gráficos de pastel
};

@Component({
  selector: 'app-client-report',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterModule,
    FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatChipsModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatMenuModule,
    MatBadgeModule, MatDividerModule, MatExpansionModule,
    NgApexchartsModule
  ],
  templateUrl: './client-report.component.html',
  styleUrl: './client-report.component.css'
})
export class ClientReportComponent implements OnInit, OnDestroy {
  clientId!: number;
  client!: CommissionerClient;
  kpiDetails!: ClientKpi;
  commissions: CommissionSummary[] = [];
  transactions: any[] = [];
  portfolioHistory: any[] = [];
  isLoadingAssets: boolean = false;
  isLoadingMonthlyCommissions: boolean = false;
  isLoading = false;
  isExporting = false;

  // Resumen de comisiones
  totalCommissionsGenerated: number = 0;
  totalOperationsCount: number = 0;
  averageCommissionPerOperation: number = 0;
  paidCount: number = 0;
  approvedCount: number = 0;
  pendingCount: number = 0;

  // Propiedades adicionales para la paginación y filtrado personalizado
  filteredCommissions: CommissionSummary[] = [];
  displayedCommissions: CommissionSummary[] = [];
  commissionFilterStatus: string = 'todos';
  commissionCurrentPage: number = 0;
  commissionPageSize: number = 5;
  commissionSortColumn: string = 'month';
  commissionSortAscending: boolean = false;
  commissionSearchQuery: string = '';
  
  commissionColumns: string[] = ['month', 'year', 'commissions_generated', 'operations_count', 'market', 'status'];
  transactionColumns: string[] = ['date', 'type', 'symbol', 'shares', 'price', 'total', 'status'];
  
  // Opciones para gráficos
  portfolioChartOptions: Partial<ChartOptions> = {};
  assetsDistributionOptions: Partial<ChartOptions> = {};
  roiChartOptions: Partial<ChartOptions> = {};
  monthlyCommissionsOptions: Partial<ChartOptions> = {};
  
  @ViewChild('commissionPaginator') commissionPaginator!: MatPaginator;
  @ViewChild('commissionSort') commissionSort!: MatSort;
  @ViewChild('transactionPaginator') transactionPaginator!: MatPaginator;
  @ViewChild('transactionSort') transactionSort!: MatSort;
  
  // Variable para mantener el estado del tema
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commissionerService: CommissionerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Detectar el tema actual
    if (typeof window !== 'undefined') {
      // Verificar modo oscuro inicial
      this.isDarkMode = document.documentElement.classList.contains('dark');
      
      // Observer para detectar cambios en el tema
      this.setupThemeObserver();
    }
    
    // Obtiene el ID del cliente de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.showError('ID de cliente no válido');
        this.navigateBack();
        return;
      }
      
      this.clientId = +idParam;
      this.loadClientData();
    });
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
   * Actualiza el tema de todos los gráficos basado en el tema actual (claro/oscuro)
   */
  updateChartsTheme(): void {
    const textColor = this.isDarkMode ? '#E5E7EB' : '#374151';
    const gridColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const backgroundColor = this.isDarkMode ? '#1F2937' : '#FFFFFF';
    
    // Actualizar tema para cada gráfico
    const commonTheme = {
      mode: this.isDarkMode ? 'dark' : 'light',
      palette: this.isDarkMode ? 'palette10' : 'palette3',
      monochrome: {
        enabled: false,
        color: this.isDarkMode ? '#10b981' : '#047857',
        shadeTo: this.isDarkMode ? 'dark' : 'light',
        shadeIntensity: 0.65
      }
    };
    
    if (this.portfolioChartOptions) {
      this.portfolioChartOptions.theme = commonTheme;
      // Actualiza también colores específicos si es necesario
    }
    
    if (this.roiChartOptions) {
      this.roiChartOptions.theme = commonTheme;
    }
    
    if (this.assetsDistributionOptions) {
      this.assetsDistributionOptions.theme = commonTheme;
    }
    
    if (this.monthlyCommissionsOptions) {
      this.monthlyCommissionsOptions.theme = commonTheme;
    }
  }
  
  ngOnDestroy(): void {
    // Limpia el observador
    if (this.destroy$) {
      this.destroy$.next();
      this.destroy$.complete();
    }
  }

  loadClientData(): void {
    this.isLoading = true;
    // Cargar datos del cliente
    this.commissionerService.getAssignedClients().subscribe({
      next: (clients) => {
        const foundClient = clients.find(c => c.id === this.clientId);
        if (!foundClient) {
          this.showError('Cliente no encontrado');
          this.navigateBack();
          return;
        }
        
        this.client = foundClient;
        
        // Carga los KPIs del cliente
        this.commissionerService.getClientKpis(this.clientId).subscribe({
          next: (kpis) => {
            this.kpiDetails = kpis;
            
            // Carga las comisiones del cliente
            this.commissionerService.getClientCommissions(this.clientId).subscribe({
              next: (commissions) => {
                this.commissions = commissions;
                // Calcular resumen de comisiones
                this.calculateCommissionSummary();

                this.commissionDataSource = new MatTableDataSource(this.commissions);
                
                // Genera datos mockeados para las transacciones y el historial del portfolio
                this.generateMockData();
                
                // Configura los gráficos con el tema actual
                this.setupCharts();
                this.updateChartsTheme();
                
                this.isLoading = false;
                
                // Configuración de tablas después de que los datos estén disponibles
                setTimeout(() => {
                  if (this.commissionDataSource) {
                    this.commissionDataSource.paginator = this.commissionPaginator;
                    this.commissionDataSource.sort = this.commissionSort;
                  }
                  
                  if (this.transactionDataSource) {
                    this.transactionDataSource.paginator = this.transactionPaginator;
                    this.transactionDataSource.sort = this.transactionSort;
                  }
                });
              },
              error: (err) => {
                console.error('Error cargando comisiones:', err);
                this.loadMockCompleteData();
              }
            });
          },
          error: (err) => {
            console.error('Error cargando KPIs:', err);
            this.loadMockCompleteData();
          }
        });
      },
      error: (err) => {
        console.error('Error cargando cliente:', err);
        this.loadMockCompleteData();
      }
    });
  }

  setupCharts(): void {
    // Configuración del gráfico de evolución del portfolio
    this.setupPortfolioChart();
    
    // Configuración del gráfico de distribución de activos
    this.setupAssetsDistributionChart();
    
    // Configuración del gráfico de ROI
    this.setupRoiChart();
    
    // Configuración del gráfico de comisiones mensuales
    this.setupMonthlyCommissionsChart();
  }

  setupPortfolioChart(): void {
    const dates = this.portfolioHistory.map(item => item.date);
    const values = this.portfolioHistory.map(item => item.value);
    
    this.portfolioChartOptions = {
      series: [
        {
          name: 'Valor del Portfolio',
          data: values
        }
      ],
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      title: {
        text: 'Evolución del Valor del Portfolio',
        align: 'left'
      },
      xaxis: {
        categories: dates,
        type: 'datetime'
      },
      yaxis: {
        title: {
          text: 'Valor ($)'
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        }
      },
      colors: ['#16a34a'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2
        }
      }
    };
  }

  setupAssetsDistributionChart(): void {
    const assets = this.kpiDetails.main_assets.map(asset => asset.name);
    const percentages = this.kpiDetails.main_assets.map(asset => asset.percentage);
    
    this.assetsDistributionOptions = {
      series: percentages,
      chart: {
        type: 'donut',
        height: 350
      },
      labels: assets,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      title: {
        text: 'Distribución de Activos',
        align: 'left'
      },
      colors: ['#16a34a', '#059669', '#10b981', '#34d399', '#6ee7b7']
    };
  }

  setupRoiChart(): void {
    // Comparativa de ROI vs promedio del mercado
    this.roiChartOptions = {
      series: [
        {
          name: 'ROI del Cliente',
          data: [this.kpiDetails.roi_percentage]
        },
        {
          name: 'ROI Promedio',
          data: [8.5] // Valor de ejemplo para el promedio del mercado
        }
      ],
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        }
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
        categories: ['ROI (%)']
      },
      yaxis: {
        title: {
          text: 'Porcentaje (%)'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return val + "%";
          }
        }
      },
      title: {
        text: 'Comparativa de ROI',
        align: 'left'
      },
      colors: ['#16a34a', '#9ca3af']
    };
  }

  setupMonthlyCommissionsChart(): void {
    // Agrupa comisiones por mes para mostrar tendencia
    const months = this.commissions.map(c => `${c.month}/${c.year}`);
    const amounts = this.commissions.map(c => c.commissions_generated);
    
    this.monthlyCommissionsOptions = {
      series: [
        {
          name: 'Comisiones',
          data: amounts
        }
      ],
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        }
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
        categories: months
      },
      yaxis: {
        title: {
          text: 'Monto ($)'
        }
      },
      fill: {
        opacity: 1
      },
      title: {
        text: 'Comisiones Mensuales',
        align: 'left'
      },
      colors: ['#16a34a']
    };
  }

  generateMockData(): void {
    // Genera datos de historial de portfolio para 12 meses
    const now = new Date();
    this.portfolioHistory = [];
    let baseValue = this.kpiDetails.total_invested * 0.8; // Comenzamos un poco más bajo
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Simula un crecimiento con algo de variación
      const change = (Math.random() * 0.1) - 0.03; // Entre -3% y +7%
      baseValue = baseValue * (1 + change);
      
      this.portfolioHistory.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * 100) / 100
      });
    }
    
    // Crea un historial de transacciones de ejemplo
    this.transactions = [];
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB'];
    const types = ['compra', 'venta'];
    
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Transacciones en los últimos 60 días
      
      const type = types[Math.floor(Math.random() * types.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const shares = Math.floor(Math.random() * 10) + 1;
      const price = Math.round(Math.random() * 500 * 100) / 100;
      
      this.transactions.push({
        date: date,
        type: type,
        symbol: symbol,
        shares: shares,
        price: price,
        total: Math.round(shares * price * 100) / 100,
        status: Math.random() > 0.1 ? 'completada' : 'pendiente'
      });
    }
    
    // Ordena transacciones por fecha, más recientes primero
    this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Crea la tabla de transacciones
    this.transactionDataSource = new MatTableDataSource(this.transactions);
  }

  exportReport(format: 'pdf' | 'excel' | 'csv'): void {
    this.isExporting = true;
    
    this.commissionerService.exportReport(format).subscribe({
      next: (blob) => {
        // En un caso real, esto descargaría el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-cliente-${this.client.name}-${format}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.isExporting = false;
        this.snackBar.open(`Reporte exportado en formato ${format.toUpperCase()}`, 'Cerrar', {
          duration: 3000
        });
      },
      error: (err) => {
        this.isExporting = false;
        this.handleError(err);
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/commissioner-panel']);
  }
  
  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  handleError(error: any): void {
    console.error('Error:', error);
    this.isLoading = false;
    this.showError('Error al cargar datos del cliente');
  }

  /**
   * Carga datos mock completos para todos los aspectos del reporte
   */
  loadMockCompleteData(): void {
    this.snackBar.open('Cargando datos simulados debido a un error de conexión', 'Cerrar', { duration: 5000 });
    
    // Cliente mock
    this.client = {
      id: this.clientId,
      name: 'Juan Pérez García',
      email: 'juan.perez@example.com',
      phone_number: '3001234567',
      registration_date: '2021-06-15',
      status: 'active',
      total_investment: 25000,
      roi_percentage: 12.5,
      main_assets: ['AAPL', 'MSFT', 'GOOGL'],
      last_operation_date: '2023-05-20'
    };
    
    // KPIs mock
    this.kpiDetails = {
      total_invested: 25000,
      current_value: 28125,
      roi_percentage: 12.5,
      operations_count: 42,
      main_assets: [
        { symbol: 'AAPL', name: 'Apple Inc.', value: 9000, percentage: 32 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', value: 7500, percentage: 26.7 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 5625, percentage: 20 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', value: 3750, percentage: 13.3 },
        { symbol: 'META', name: 'Meta Platforms Inc.', value: 2250, percentage: 8 }
      ]
    };
    
    // Comisiones mock
    this.commissions = [
      {
        id: 1,
        client_id: this.clientId,
        client_name: 'Juan Pérez García',
        month: 'Enero',
        year: 2023,
        commissions_generated: 120,
        operations_count: 8,
        market: 'NASDAQ',
        status: 'paid'
      },
      {
        id: 2,
        client_id: this.clientId,
        client_name: 'Juan Pérez García',
        month: 'Febrero',
        year: 2023,
        commissions_generated: 150,
        operations_count: 10,
        market: 'NASDAQ',
        status: 'paid'
      },
      {
        id: 3,
        client_id: this.clientId,
        client_name: 'Juan Pérez García',
        month: 'Marzo',
        year: 2023,
        commissions_generated: 180,
        operations_count: 12,
        market: 'NYSE',
        status: 'paid'
      },
      {
        id: 4,
        client_id: this.clientId,
        client_name: 'Juan Pérez García',
        month: 'Abril',
        year: 2023,
        commissions_generated: 135,
        operations_count: 9,
        market: 'BVC',
        status: 'approved'
      },
      {
        id: 5,
        client_id: this.clientId,
        client_name: 'Juan Pérez García',
        month: 'Mayo',
        year: 2023,
        commissions_generated: 165,
        operations_count: 11,
        market: 'NASDAQ',
        status: 'pending'
      }
    ];
    
    this.commissionDataSource = new MatTableDataSource(this.commissions);
    
    // Calcular resumen de comisiones
    this.calculateCommissionSummary();
    
    // Generar datos simulados para transacciones y portfolio
    this.generateMockData();
    
    // Configurar gráficos y aplicar tema
    this.setupCharts();
    this.updateChartsTheme();
    
    // Configuración de tablas
    setTimeout(() => {
      if (this.commissionDataSource) {
        this.commissionDataSource.paginator = this.commissionPaginator;
        this.commissionDataSource.sort = this.commissionSort;
      }
      
      if (this.transactionDataSource) {
        this.transactionDataSource.paginator = this.transactionPaginator;
        this.transactionDataSource.sort = this.transactionSort;
      }
    });
    
    this.isLoading = false;
  }
  
  /**
   * Calcula el resumen de comisiones
   */
  calculateCommissionSummary(): void {
    // Inicializa los contadores
    this.totalCommissionsGenerated = 0;
    this.totalOperationsCount = 0;
    this.paidCount = 0;
    this.approvedCount = 0;
    this.pendingCount = 0;
    
    // Recorre las comisiones para calcular los totales
    this.commissions.forEach(commission => {
      this.totalCommissionsGenerated += commission.commissions_generated;
      this.totalOperationsCount += commission.operations_count;
      
      // Contadores por estado
      if (commission.status === 'paid') {
        this.paidCount++;
      } else if (commission.status === 'approved') {
        this.approvedCount++;
      } else if (commission.status === 'pending') {
        this.pendingCount++;
      }
    });
    
    // Calcula promedio de comisión por operación
    this.averageCommissionPerOperation = this.totalOperationsCount > 0 ? 
      this.totalCommissionsGenerated / this.totalOperationsCount : 0;
      
    // Inicializa los filtros
    this.filteredCommissions = [...this.commissions];
    this.updateCommissionDisplay();
  }
  
  /**
   * Filtra las comisiones por estado
   */
  filterCommissionsByStatus(status: string): void {
    this.commissionFilterStatus = status;
    this.commissionCurrentPage = 0; // Resetear a la primera página
    this.filterCommissions();
  }
  
  /**
   * Aplica el filtro de búsqueda para comisiones
   */
  applyCommissionFilter(event: Event): void {
    this.commissionSearchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.commissionCurrentPage = 0; // Resetear a la primera página
    this.filterCommissions();
  }
  
  /**
   * Filtra las comisiones según los criterios actuales
   */
  filterCommissions(): void {
    // Copia todas las comisiones
    let result = [...this.commissions];
    
    // Filtrar por estado
    if (this.commissionFilterStatus !== 'todos') {
      const statusMap: { [key: string]: string } = {
        'pagadas': 'paid',
        'aprobadas': 'approved',
        'pendientes': 'pending'
      };
      result = result.filter(commission => 
        commission.status === statusMap[this.commissionFilterStatus]
      );
    }
    
    // Filtrar por texto de búsqueda
    if (this.commissionSearchQuery) {
      result = result.filter(commission => 
        commission.month.toLowerCase().includes(this.commissionSearchQuery) ||
        commission.year.toString().includes(this.commissionSearchQuery) ||
        commission.market.toLowerCase().includes(this.commissionSearchQuery) ||
        commission.status.toLowerCase().includes(this.commissionSearchQuery)
      );
    }
    
    // Aplicar orden
    this.sortCommissionsData(result);
    
    this.filteredCommissions = result;
    this.updateCommissionDisplay();
  }
  
  /**
   * Ordena las comisiones por la columna especificada
   */
  sortCommissions(column: string): void {
    // Si ya está ordenando por esta columna, invierte el orden
    if (this.commissionSortColumn === column) {
      this.commissionSortAscending = !this.commissionSortAscending;
    } else {
      this.commissionSortColumn = column;
      this.commissionSortAscending = true;
    }
    
    this.sortCommissionsData(this.filteredCommissions);
    this.updateCommissionDisplay();
  }
  
  /**
   * Implementa el algoritmo de ordenamiento para los datos de comisiones
   */
  sortCommissionsData(data: CommissionSummary[]): void {
    data.sort((a, b) => {
      let valueA: any = a[this.commissionSortColumn as keyof CommissionSummary];
      let valueB: any = b[this.commissionSortColumn as keyof CommissionSummary];
      
      // Convertir a números si es posible para comparación numérica
      if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        valueA = Number(valueA);
        valueB = Number(valueB);
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      // Comparación
      if (valueA < valueB) return this.commissionSortAscending ? -1 : 1;
      if (valueA > valueB) return this.commissionSortAscending ? 1 : -1;
      return 0;
    });
  }
  
  /**
   * Actualiza los elementos mostrados según la paginación actual
   */
  updateCommissionDisplay(): void {
    const startIndex = this.commissionCurrentPage * this.commissionPageSize;
    this.displayedCommissions = this.filteredCommissions.slice(
      startIndex, 
      startIndex + this.commissionPageSize
    );
  }
  
  /**
   * Avanza a la página siguiente
   */
  nextCommissionPage(): void {
    if ((this.commissionCurrentPage + 1) * this.commissionPageSize < this.filteredCommissions.length) {
      this.commissionCurrentPage++;
      this.updateCommissionDisplay();
    }
  }
  
  /**
   * Retrocede a la página anterior
   */
  prevCommissionPage(): void {
    if (this.commissionCurrentPage > 0) {
      this.commissionCurrentPage--;
      this.updateCommissionDisplay();
    }
  }
  
  /**
   * Obtiene el rango de páginas a mostrar en la paginación
   */
  getCommissionPageRange(): number[] {
    const totalPages = Math.ceil(this.filteredCommissions.length / this.commissionPageSize);
    const maxPagesToShow = 5; // Mostrar máximo 5 botones de página
    
    // Si hay pocas páginas, mostrar todas
    if (totalPages <= maxPagesToShow) {
      return Array.from({length: totalPages}, (_, i) => i);
    }
    
    // Si estamos cerca del inicio
    if (this.commissionCurrentPage < Math.floor(maxPagesToShow / 2)) {
      return Array.from({length: maxPagesToShow}, (_, i) => i);
    }
    
    // Si estamos cerca del final
    if (this.commissionCurrentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
      return Array.from({length: maxPagesToShow}, (_, i) => totalPages - maxPagesToShow + i);
    }
    
    // Estamos en el medio
    return Array.from(
      {length: maxPagesToShow}, 
      (_, i) => this.commissionCurrentPage - Math.floor(maxPagesToShow / 2) + i
    );
  }


