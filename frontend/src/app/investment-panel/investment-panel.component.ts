import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
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
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// No importamos jspdf y html2canvas directamente aquí

import { PortfolioService } from '../services/portfolio.service';
import { PortfolioSummary, Stock } from '../models/portfolio.model';
import { Order } from '../models/order.model';
import { OrdersService } from '../services/orders.service';

// Re-defining ChartOptions locally to avoid circular dependencies
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
  selector: 'app-investment-panel',
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
  templateUrl: './investment-panel.component.html',
  styleUrls: ['./investment-panel.component.css']
})
export class InvestmentPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data sources
  dataSource = new MatTableDataSource<Order>([]);
  
  // Columns
  displayedColumns: string[] = ['share', 'side', 'type', 'qty', 'filled_avg_price', 'status', 'create_at'];

  // Stats
  portfolioSummary: PortfolioSummary = {
    totalInvested: 0,
    totalEarnings: 0,
    totalShares: 0,
    totalValue: 0,
    performance: 0,
    asset_allocation: [],
    performance_over_time: []
  };
  
  // Charts
  assetAllocationChartOptions: Partial<ChartOptions> = {};
  performanceChartOptions: Partial<ChartOptions> = {};
  
  // UI State
  isLoading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private portfolioService: PortfolioService,
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.loadInvestmentData();
    this.initCharts();
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadInvestmentData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.portfolioService.getPortfolioSummary().pipe(takeUntil(this.destroy$)).subscribe({
      next: (summary: PortfolioSummary) => {
        this.portfolioSummary = summary;
        this.updateCharts();
      },
      error: (err: any) => {
        this.error = 'Failed to load portfolio summary.';
        console.error(err);
      }
    });

    this.ordersService.getRecentOrders().pipe(takeUntil(this.destroy$)).subscribe({
      next: (orders: Order[]) => {
        this.dataSource.data = orders;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load recent orders.';
        console.error(err);
        this.isLoading = false;
      }
    });
  }
  
  initCharts(): void {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e2e8f0' : '#334155';

    this.assetAllocationChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 300,
        foreColor: textColor
      },
      labels: [],
      theme: {
        mode: isDark ? 'dark' : 'light'
      }
    };

    this.performanceChartOptions = {
      series: [],
      chart: {
        type: 'area',
        height: 300,
        foreColor: textColor,
        toolbar: {
          show: false
        }
      },
      xaxis: {
        type: 'datetime'
      },
      theme: {
        mode: isDark ? 'dark' : 'light'
      }
    };
  }
  
  updateCharts(): void {
    // Ensure portfolioSummary and its properties are not null/undefined before mapping
    const assetAllocation = this.portfolioSummary?.asset_allocation || [];
    const performanceOverTime = this.portfolioSummary?.performance_over_time || [];

    // Asset Allocation
    this.assetAllocationChartOptions.series = assetAllocation.map((a: { asset: string, value: number }) => a.value);
    this.assetAllocationChartOptions.labels = assetAllocation.map((a: { asset: string, value: number }) => a.asset);

    // Performance
    this.performanceChartOptions.series = [{
      name: 'Performance',
      data: performanceOverTime.map((p: { date: string, value: number }) => [new Date(p.date).getTime(), p.value])
    }];
    
    this.cdr.detectChanges();
  }

  formatCurrency(value: number): string {
    return value?.toLocaleString('es-CO', { style: 'currency', currency: 'USD' }) || '$0';
  }

  formatPercentage(value: number): string {
    return value?.toFixed(2) + '%' || '0%';
  }

  async exportToPdf(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.snackBar.open('La exportación a PDF solo está disponible en el navegador.', 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
    }

    this.snackBar.open('Generando PDF...', 'Cerrar', { duration: 3000 });
    const data = document.querySelector('.min-h-screen') as HTMLElement; // Select the main container

    if (!data) {
      this.snackBar.open('Error: No se encontró el contenido para exportar.', 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(data);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('panel_inversiones.pdf');
      this.snackBar.open('PDF generado exitosamente.', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.snackBar.open('Error al generar el PDF. Inténtalo de nuevo.', 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
}
