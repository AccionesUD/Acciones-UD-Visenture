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
import { MatDialogModule, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommissionerService } from '../../services/commissioner.service';
import { 
  CommissionerClient, 
  ClientKpi, 
  CommissionSummary, 
  CommissionerStats, 
  CommissionerFilters 
} from '../../models/commissioner.model';
import { ClientSharePosition } from '../../models/client-portfolio.model';
import { CommissionerList } from '../../models/commissioner.model';

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
  selector: 'app-middleman',
  templateUrl: './middleman.component.html',
  styleUrls: ['./middleman.component.css'],
  imports: [CommonModule]
})
export class MiddlemanComponent implements OnInit, OnDestroy, AfterViewInit {
  // Acción para el botón "Ver detalles" en el ranking de mejores comisionistas
  viewComissionerDetails(client: any): void {
    this.viewClientDetails(client);
  }
   // Variables para comisionistas
    displayedColumns: string[] = ['name', 'email', 'registration_date', 'status', 'total_investment', 'roi_percentage', 'last_operation_date', 'actions'];
    dataSource = new MatTableDataSource<CommissionerList>([]);
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
    currentTabIndex = 0; // Rastrear la pestaña actual
    
    // Filtros
    filterForm!: FormGroup;
    
    // Markets disponibles para filtrado
    markets: {value: string, label: string}[] = [
      { value: '', label: $localize`:@@commissioner.filters.market.all:Todos los mercados` },
      { value: 'US', label: $localize`:@@commissioner.filters.market.us:Estados Unidos` },
      { value: 'LATAM', label: $localize`:@@commissioner.filters.market.latam:Latinoamérica` },
      { value: 'EU', label: $localize`:@@commissioner.filters.market.eu:Europa` },
      { value: 'ASIA', label: $localize`:@@commissioner.filters.market.asia:Asia` }
    ];
    
    // Estados de cliente disponibles para filtrado
    statuses: {value: string, label: string}[] = [
      { value: '', label: $localize`:@@commissioner.filters.status.all:Todos los estados` },
      { value: 'active', label: $localize`:@@commissioner.filters.status.active:Activo` },
      { value: 'inactive', label: $localize`:@@commissioner.filters.status.inactive:Inactivo` },
      { value: 'pending', label: $localize`:@@commissioner.filters.status.pending:Pendiente` }
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
      
      // Cargar datos iniciales
      this.loadData();
      
    }
    
    ngAfterViewInit(): void {
    }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(forceRefresh = false): void {
    this.isLoading = true;
    this.error = null;

  }

formatCurrency(value: number): string {
    return value?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) || '$0';
  }
  
  // Helper para formatear porcentajes
formatPercentage(value: number): string {
  return value?.toFixed(2) + '%' || '0%';
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
  
private configureDataTable(): void {
    // Configurar tabla de comisionistas
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

viewClientDetails(client: any): void {
    // Navegamos a la vista de detalle del comisionista
  const clientId = client.id || client.client_id;
  if (clientId) {
    this.router.navigate(['/commissioner-panel/client', clientId]);
  } else {
    this.snackBar.open('No se pudo encontrar el ID del comisionista', 'Cerrar', {
      duration: 3000
    });
  }
}
}