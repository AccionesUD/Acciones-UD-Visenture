import { Component, OnInit, ViewChild } from '@angular/core';
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
export class ClientReportComponent implements OnInit {
  clientId!: number;
  client!: CommissionerClient;
  kpiDetails!: ClientKpi;
  commissions: CommissionSummary[] = [];
  transactions: any[] = [];
  portfolioHistory: any[] = [];

  // Resumen de comisiones
  totalCommissionsGenerated: number = 0;
  totalOperationsCount: number = 0;
  averageCommissionPerOperation: number = 0;
  paidCount: number = 0;
  approvedCount: number = 0;
  pendingCount: number = 0;

  // Para las tablas de datos
  commissionDataSource: MatTableDataSource<CommissionSummary> = new MatTableDataSource<CommissionSummary>([]);
  transactionDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commissionerService: CommissionerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
                
                // Configura los gráficos
                this.setupCharts();
                
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
              error: (err) => this.handleError(err)
            });
          },
          error: (err) => this.handleError(err)
        });
      },
      error: (err) => this.handleError(err)
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

  private calculateCommissionSummary(): void {
    this.totalCommissionsGenerated = this.commissions.reduce((sum, c) => sum + c.commissions_generated, 0);
    this.totalOperationsCount = this.commissions.reduce((sum, c) => sum + c.operations_count, 0);
    this.averageCommissionPerOperation = this.totalCommissionsGenerated / Math.max(1, this.totalOperationsCount);
    this.paidCount = this.commissions.filter(c => c.status === 'paid').length;
    this.approvedCount = this.commissions.filter(c => c.status === 'approved').length;
    this.pendingCount = this.commissions.filter(c => c.status === 'pending').length;
  }
}
