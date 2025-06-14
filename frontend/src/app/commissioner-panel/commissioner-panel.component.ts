import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
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
  ApexGrid
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
  stroke?: any;        // Añadido para gráficos de línea/barra
  grid?: ApexGrid;      // Añadido para permitir definir la cuadrícula en algunos gráficos
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
export class CommissionerPanelComponent implements OnInit, AfterViewInit {
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
    this.loadData();
    this.initializeCharts();
  }
  
  ngAfterViewInit(): void {
    // Configurar paginación y ordenamiento cuando las vistas estén listas
    setTimeout(() => {
      if (this.clientDataSource && this.clientsPaginator && this.clientsSort) {
        this.clientDataSource.paginator = this.clientsPaginator;
        this.clientDataSource.sort = this.clientsSort;
      }
      
      if (this.commissionDataSource && this.commissionsPaginator && this.commissionsSort) {
        this.commissionDataSource.paginator = this.commissionsPaginator;
        this.commissionDataSource.sort = this.commissionsSort;
      }
    });
  }
  
  loadData(): void {
    this.isLoading = true;
    
    const filters: CommissionerFilters = {
      client_name: this.filterForm.value.client_name || undefined,
      market: this.filterForm.value.market || undefined,
      asset_type: this.filterForm.value.asset_type || undefined,
      status: this.filterForm.value.status || undefined
    };
    
    if (this.filterForm.value.date_from && this.filterForm.value.date_to) {
      filters.date_range = {
        start: this.filterForm.value.date_from,
        end: this.filterForm.value.date_to
      };
    }
    
    this.commissionerService.getCommissionerReport(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.clients = response.data.clients;
          this.clientKpis = response.data.kpis;
          this.commissions = response.data.commissions;
          this.statistics = response.data.statistics;
          
          // Actualizar datasources
          this.clientDataSource.data = this.clients;
          this.commissionDataSource.data = this.commissions;
          
          // Actualizar gráficos
          this.updateCharts();
        } else {
          this.showError('No se pudieron cargar los datos');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del panel:', err);
        this.showError('Error al cargar datos del panel');
        this.isLoading = false;
      }
    });
  }
  
  selectClient(client: CommissionerClient): void {
    this.selectedClient = client;
    this.selectedClientKpi = this.clientKpis.find(kpi => kpi.client_id === client.id) || null;
    
    // Filtrar comisiones para este cliente
    this.commissionDataSource.data = this.commissions.filter(c => c.client_id === client.id);
    
    // Cambiar a la pestaña de detalles
    this.activeTab = 1;
  }
  
  clearFilters(): void {
    this.filterForm.reset();
    this.loadData();
  }
  
  applyFilters(): void {
    this.loadData();
  }
  
  exportData(format: 'csv' | 'pdf' | 'excel'): void {
    this.isExporting = true;
    
    const filters: CommissionerFilters = {
      client_name: this.filterForm.value.client_name || undefined,
      market: this.filterForm.value.market || undefined,
      asset_type: this.filterForm.value.asset_type || undefined,
      status: this.filterForm.value.status || undefined
    };
    
    if (this.filterForm.value.date_from && this.filterForm.value.date_to) {
      filters.date_range = {
        start: this.filterForm.value.date_from,
        end: this.filterForm.value.date_to
      };
    }
    
    this.commissionerService.exportReport(format, filters).subscribe({
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
  
  updateCharts(): void {
    if (!this.statistics || this.clients.length === 0 || this.commissions.length === 0) {
      return;
    }
    
    // Actualizar gráfico de comisiones por cliente
    const clientNames = this.clients.map(client => client.name);
    const clientCommissions = this.clients.map(client => {
      const totalCommissions = this.commissions
        .filter(c => c.client_id === client.id)
        .reduce((sum, c) => sum + c.commissions_generated, 0);
      return parseFloat(totalCommissions.toFixed(2));
    });
    
    this.commissionChartOptions.series = [{
      name: 'Comisiones',
      data: clientCommissions
    }];
    this.commissionChartOptions.xaxis = {
      categories: clientNames
    };
    
    // Actualizar gráfico de ROI por cliente
    const clientRois = this.clients.map(client => parseFloat(client.roi_percentage.toFixed(2)));
    
    this.roiChartOptions.series = [{
      name: 'ROI',
      data: clientRois
    }];
    this.roiChartOptions.xaxis = {
      categories: clientNames
    };
    
    // Actualizar gráfico de distribución por mercado
    if (this.statistics.commissions_by_market && this.statistics.commissions_by_market.length > 0) {
      const markets = this.statistics.commissions_by_market.map(m => m.market);
      const percentages = this.statistics.commissions_by_market.map(m => m.percentage);
      
      // Convertir a formato adecuado para ApexCharts
      this.marketShareChartOptions.series = [{
        data: percentages
      }];
      
      // Añadir las etiquetas como categorías en xaxis
      if (!this.marketShareChartOptions.xaxis) {
        this.marketShareChartOptions.xaxis = { categories: markets };
      } else {
        this.marketShareChartOptions.xaxis.categories = markets;
      }
    }
    
    // Actualizar gráfico de rendimiento mensual
    // Agrupar comisiones por mes
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const commissionsByMonth = new Map<string, number>();
    
    this.commissions.forEach(commission => {
      const key = `${commission.month} ${commission.year}`;
      const currentValue = commissionsByMonth.get(key) || 0;
      commissionsByMonth.set(key, currentValue + commission.commissions_generated);
    });
    
    const monthLabels = Array.from(commissionsByMonth.keys());
    const monthValues = Array.from(commissionsByMonth.values()).map(value => parseFloat(value.toFixed(2)));
    
    this.monthlyPerformanceChartOptions.series = [{
      name: 'Comisiones',
      data: monthValues
    }];
    this.monthlyPerformanceChartOptions.xaxis = {
      categories: monthLabels
    };
  }
  
  getClientStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }
  
  getCommissionStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }
  
  getRoiClass(roi: number): string {
    if (roi > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (roi < 0) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  }
  
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  
  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  backToList(): void {
    this.selectedClient = null;
    this.selectedClientKpi = null;
    this.commissionDataSource.data = this.commissions;
    this.activeTab = 0;
  }
}
