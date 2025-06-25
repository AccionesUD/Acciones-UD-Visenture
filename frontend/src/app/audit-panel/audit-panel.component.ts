import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AuditService } from '../services/audit.service';
import { 
  AuditTransaction, 
  AuditAlert, 
  AuditFilters, 
  AuditStats, 
  UserActivityTimeline,
  RiskPattern,
  SuspiciousActivityReport,
  ComplianceReport,
  ExportRequest,
  ChartOptions
} from '../models/audit.model';

import { TransactionDetailDialogComponent } from './transaction-detail-dialog/transaction-detail-dialog.component';
import { AlertDetailDialogComponent } from './alert-detail-dialog/alert-detail-dialog.component';
import { FlagTransactionDialogComponent } from './flag-transaction-dialog/flag-transaction-dialog.component';
import { ReviewTransactionDialogComponent } from './review-transaction-dialog/review-transaction-dialog.component';
import { AssignAlertDialogComponent } from './assign-alert-dialog/assign-alert-dialog.component';
import { ResolveAlertDialogComponent } from './resolve-alert-dialog/resolve-alert-dialog.component';
import { ComplianceReportDialogComponent } from './compliance-report-dialog/compliance-report-dialog.component';
import { UserTimelineDialogComponent } from './user-timeline-dialog/user-timeline-dialog.component';

@Component({
  selector: 'app-audit-panel',
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
    MatMenuModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgApexchartsModule
  ],
  providers: [AuditService],
  templateUrl: './audit-panel.component.html',
  styleUrls: ['./audit-panel.component.css']
})
export class AuditPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Propiedades para las tablas
  transactionsDisplayedColumns: string[] = [
    'select', 'date_transaction', 'user_name', 'type_transaction', 
    'value_transaction', 'risk_score', 'status', 'actions'
  ];
  alertsDisplayedColumns: string[] = [
    'select', 'created_at', 'alert_type', 'severity', 
    'description', 'status', 'actions'
  ];
  
  transactionsDataSource: MatTableDataSource<AuditTransaction> = new MatTableDataSource<AuditTransaction>([]);
  alertsDataSource: MatTableDataSource<AuditAlert> = new MatTableDataSource<AuditAlert>([]);
  
  transactionsSelection = new SelectionModel<AuditTransaction>(true, []);
  alertsSelection = new SelectionModel<AuditAlert>(true, []);

  @ViewChild('transactionsPaginator') transactionsPaginator!: MatPaginator;
  @ViewChild('alertsPaginator') alertsPaginator!: MatPaginator;
  @ViewChild('transactionsSort') transactionsSort!: MatSort;
  @ViewChild('alertsSort') alertsSort!: MatSort;

  // Estado UI
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  selectedTabIndex = 0;

  // Filtros
  filterForm!: FormGroup;
  
  // Opciones para filtros (basadas en el modelo y similares a otros componentes)
  transactionTypes: { value: string, label: string }[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'BUY', label: 'Compra' },
    { value: 'SELL', label: 'Venta' },
    { value: 'DEPOSIT', label: 'Depósito' },
    { value: 'WITHDRAWAL', label: 'Retiro' },
    { value: 'TRANSFER', label: 'Transferencia' }
  ];

  transactionStatuses: { value: string, label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'FAILED', label: 'Fallida' },
    { value: 'CANCELLED', label: 'Cancelada' }
  ];

  riskLevels: { value: string, label: string }[] = [
    { value: '', label: 'Todos los niveles' },
    { value: 'low', label: 'Bajo (0-30)' },
    { value: 'medium', label: 'Medio (31-70)' },
    { value: 'high', label: 'Alto (71-100)' }
  ];

  alertTypes: { value: string, label: string }[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'HIGH_VOLUME', label: 'Alto Volumen' },
    { value: 'UNUSUAL_PATTERN', label: 'Patrón Inusual' },
    { value: 'VELOCITY_CHECK', label: 'Control de Velocidad' },
    { value: 'GEOGRAPHIC_ANOMALY', label: 'Anomalía Geográfica' },
    { value: 'SUSPICIOUS_ACTIVITY', label: 'Actividad Sospechosa' }
  ];

  alertSeverities: { value: string, label: string }[] = [
    { value: '', label: 'Todas las severidades' },
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'CRITICAL', label: 'Crítica' }
  ];

  alertStatuses: { value: string, label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'OPEN', label: 'Abierta' },
    { value: 'INVESTIGATING', label: 'Investigando' },
    { value: 'RESOLVED', label: 'Resuelta' },
    { value: 'FALSE_POSITIVE', label: 'Falso Positivo' }
  ];

  // Paginación
  totalTransactions = 0;
  totalAlerts = 0;
  pageSize = 25;
  currentPage = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Datos
  auditStats: AuditStats | null = null;
  riskPatterns: RiskPattern[] = [];
  complianceReports: ComplianceReport[] = [];

  // Gráficos (definidos como no opcionales para evitar errores)
  transactionTrendsChartOptions!: Partial<ChartOptions>;
  riskDistributionChartOptions!: Partial<ChartOptions>;
  alertsTrendsChartOptions!: Partial<ChartOptions>;

  constructor(
    private auditService: AuditService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    // Configurar detector de cambios de tema
    this.setupThemeObserver();
    
    // Inicializar datos y gráficos
    this.loadAuditData();
    this.loadAuditStats();
    this.loadRiskPatterns();
    this.setupFilterSubscription();
    this.initializeCharts();
    
    // Detectar tema actual
    const isDark = document.documentElement.classList.contains('dark');
    this.updateChartsTheme(isDark);
  }

  ngAfterViewInit(): void {
    // Configurar paginadores y ordenamiento
    this.transactionsDataSource.paginator = this.transactionsPaginator;
    this.transactionsDataSource.sort = this.transactionsSort;
    this.alertsDataSource.paginator = this.alertsPaginator;
    this.alertsDataSource.sort = this.alertsSort;
    
    // Forzar actualización de los gráficos para garantizar que se rendericen correctamente
    // Esta secuencia de timeouts es similar a la implementación en commissioner-panel
    setTimeout(() => {
      // Verificar el tema actual
      const isDark = document.documentElement.classList.contains('dark');
      this.updateChartsTheme(isDark);
      
      // Forzar detección de cambios para asegurar que las gráficas se rendericen
      this.cdr.detectChanges();
      
      // Segundo timeout para garantizar que las gráficas se rendericen después de que Angular haya procesado cambios
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 300);
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      searchText: [''],
      dateFrom: [null],
      dateTo: [null],
      transactionType: [''],
      transactionStatus: [''],
      riskLevel: [''],
      minAmount: [null],
      maxAmount: [null],
      alertType: [''],
      alertSeverity: [''],
      alertStatus: [''],
      suspiciousOnly: [false],
      reviewedOnly: [false]
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  loadAuditData(forceReload = false): void {
    this.isLoading = true;
    this.error = null;

    const filters = this.buildFiltersFromForm();
    
    // Para desarrollo, usar datos simulados
    this.auditService.getMockAuditData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactionsDataSource.data = response.transactions;
        this.alertsDataSource.data = response.alerts;
        this.totalTransactions = response.total;
        this.totalAlerts = response.alerts.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos de auditoría. Por favor, inténtelo de nuevo.';
        this.isLoading = false;
        this.showErrorSnackBar(this.error);
        this.cdr.detectChanges();
      }
    });

    // Implementación real (comentada para desarrollo)
    /*
    this.auditService.getAuditData(filters, this.currentPage + 1, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactionsDataSource.data = response.transactions;
        this.alertsDataSource.data = response.alerts;
        this.totalTransactions = response.total;
        this.totalAlerts = response.alerts.length;
        this.auditStats = response.stats;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos de auditoría. Por favor, inténtelo de nuevo.';
        this.isLoading = false;
        this.showErrorSnackBar(this.error);
        this.cdr.detectChanges();
      }
    });
    */
  }

  private loadAuditStats(): void {
    this.isLoadingStats = true;
    
    // Usar stats de los datos simulados
    this.auditService.getMockAuditData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.auditStats = response.stats;
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadRiskPatterns(): void {
    // Implementación real comentada para desarrollo
    /*
    this.auditService.getRiskPatterns().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (patterns) => {
        this.riskPatterns = patterns;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading risk patterns:', error);
      }
    });
    */
  }

  private buildFiltersFromForm(): AuditFilters {
    const formValue = this.filterForm.value;
    return {
      searchText: formValue.searchText || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
      transactionType: formValue.transactionType || undefined,
      status: formValue.transactionStatus || undefined,
      riskScoreMin: this.getRiskScoreMin(formValue.riskLevel),
      riskScoreMax: this.getRiskScoreMax(formValue.riskLevel),
      minAmount: formValue.minAmount || undefined,
      maxAmount: formValue.maxAmount || undefined,
      alertType: formValue.alertType || undefined,
      alertSeverity: formValue.alertSeverity || undefined,
      alertStatus: formValue.alertStatus || undefined,
      suspiciousOnly: formValue.suspiciousOnly || false,
      reviewedOnly: formValue.reviewedOnly || false
    };
  }

  private getRiskScoreMin(riskLevel: string): number | undefined {
    switch (riskLevel) {
      case 'low': return 0;
      case 'medium': return 31;
      case 'high': return 71;
      default: return undefined;
    }
  }

  private getRiskScoreMax(riskLevel: string): number | undefined {
    switch (riskLevel) {
      case 'low': return 30;
      case 'medium': return 70;
      case 'high': return 100;
      default: return undefined;
    }
  }

  // Métodos de UI
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
    this.cdr.detectChanges();
  }

  onFilterSubmit(): void {
    this.currentPage = 0;
    this.loadAuditData();
  }

  applyFilters(): void {
    // Restablecer la paginación
    if (this.transactionsPaginator) {
      this.transactionsPaginator.pageIndex = 0;
    }
    if (this.alertsPaginator) {
      this.alertsPaginator.pageIndex = 0;
    }
    
    // Recargar datos con los nuevos filtros
    this.loadAuditData();
    
    // Actualizar las gráficas con los nuevos datos filtrados
    setTimeout(() => {
      this.initializeCharts();
      const isDark = document.documentElement.classList.contains('dark');
      this.updateChartsTheme(isDark);
    }, 200);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.initializeFilterForm();
    this.currentPage = 0;
    this.loadAuditData();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return Object.keys(formValue).some(key => {
      const value = formValue[key];
      return value !== null && value !== undefined && value !== '' && value !== false;
    });
  }

  // Métodos de paginación
  onTransactionsPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditData();
  }

  onAlertsPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditData();
  }

  // Métodos de selección
  isAllTransactionsSelected(): boolean {
    const numSelected = this.transactionsSelection.selected.length;
    const numRows = this.transactionsDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggleTransactions(): void {
    this.isAllTransactionsSelected() ?
      this.transactionsSelection.clear() :
      this.transactionsDataSource.data.forEach(row => this.transactionsSelection.select(row));
  }

  isAllAlertsSelected(): boolean {
    const numSelected = this.alertsSelection.selected.length;
    const numRows = this.alertsDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggleAlerts(): void {
    this.isAllAlertsSelected() ?
      this.alertsSelection.clear() :
      this.alertsDataSource.data.forEach(row => this.alertsSelection.select(row));
  }

  // Métodos de acciones
  viewTransactionDetails(transaction: AuditTransaction): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '800px';
    dialogConfig.data = { transaction };

    this.dialog.open(TransactionDetailDialogComponent, dialogConfig);
  }

  viewAlertDetails(alert: AuditAlert): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '800px';
    dialogConfig.data = { alert };

    this.dialog.open(AlertDetailDialogComponent, dialogConfig);
  }

  flagTransactionAsSuspicious(transaction: AuditTransaction): void {
    const dialogRef = this.dialog.open(FlagTransactionDialogComponent, {
      width: '500px',
      data: { transaction }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reason) {
        this.isLoading = true;
        
        this.auditService.flagTransactionAsSuspicious(transaction.id, result.reason)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedTransaction) => {
              // Actualizar la transacción en el dataSource
              const index = this.transactionsDataSource.data.findIndex(t => t.id === updatedTransaction.id);
              if (index !== -1) {
                this.transactionsDataSource.data[index] = { ...this.transactionsDataSource.data[index], ...updatedTransaction };
                this.transactionsDataSource._updateChangeSubscription();
              }
              
              this.showSuccessSnackBar('Transacción marcada como sospechosa');
              // Actualizar estadísticas si es necesario
              this.loadAuditStats();
              this.isLoading = false;
            },
            error: (error) => {
              this.showErrorSnackBar('Error al marcar la transacción como sospechosa');
              this.isLoading = false;
            }
          });
      }
    });
  }

  reviewTransaction(transaction: AuditTransaction): void {
    const dialogRef = this.dialog.open(ReviewTransactionDialogComponent, {
      width: '500px',
      data: { transaction }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        
        this.auditService.markTransactionAsReviewed(transaction.id, result.notes)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedTransaction) => {
              // Actualizar la transacción en el dataSource
              const index = this.transactionsDataSource.data.findIndex(t => t.id === updatedTransaction.id);
              if (index !== -1) {
                this.transactionsDataSource.data[index] = { ...this.transactionsDataSource.data[index], ...updatedTransaction };
                this.transactionsDataSource._updateChangeSubscription();
              }
              
              this.showSuccessSnackBar('Transacción marcada como revisada');
              this.isLoading = false;
            },
            error: (error) => {
              this.showErrorSnackBar('Error al marcar la transacción como revisada');
              this.isLoading = false;
            }
          });
      }
    });
  }

  assignAlert(alert: AuditAlert): void {
    const dialogRef = this.dialog.open(AssignAlertDialogComponent, {
      width: '500px',
      data: { alert }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.userId) {
        this.isLoading = true;
        
        this.auditService.assignAlert(alert.id, result.userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedAlert) => {
              // Actualizar la alerta en el dataSource
              const index = this.alertsDataSource.data.findIndex(a => a.id === updatedAlert.id);
              if (index !== -1) {
                this.alertsDataSource.data[index] = { ...this.alertsDataSource.data[index], ...updatedAlert };
                this.alertsDataSource._updateChangeSubscription();
              }
              
              this.showSuccessSnackBar('Alerta asignada correctamente');
              this.isLoading = false;
            },
            error: (error) => {
              this.showErrorSnackBar('Error al asignar la alerta');
              this.isLoading = false;
            }
          });
      }
    });
  }

  resolveAlert(alert: AuditAlert): void {
    const dialogRef = this.dialog.open(ResolveAlertDialogComponent, {
      width: '500px',
      data: { alert }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.resolution) {
        this.isLoading = true;
        
        this.auditService.resolveAlert(alert.id, result.resolution)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedAlert) => {
              // Actualizar la alerta en el dataSource
              const index = this.alertsDataSource.data.findIndex(a => a.id === updatedAlert.id);
              if (index !== -1) {
                this.alertsDataSource.data[index] = { ...this.alertsDataSource.data[index], ...updatedAlert };
                this.alertsDataSource._updateChangeSubscription();
              }
              
              this.showSuccessSnackBar('Alerta resuelta correctamente');
              // Actualizar estadísticas si es necesario
              this.loadAuditStats();
              this.isLoading = false;
            },
            error: (error) => {
              this.showErrorSnackBar('Error al resolver la alerta');
              this.isLoading = false;
            }
          });
      }
    });
  }

  // Métodos para exportación y reportes
  exportData(format: 'PDF' | 'EXCEL' | 'CSV'): void {
    const filters = this.buildFiltersFromForm();
    const exportRequest: ExportRequest = {
      format,
      filters,
      includeCharts: true,
      includeTimeline: true,
      reportType: 'AUDIT_DATA'
    };

    this.isLoading = true;
    this.auditService.exportAuditData(exportRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Crear un enlace para la descarga
          const a = document.createElement('a');
          a.href = response.download_url;
          a.download = response.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          this.showSuccessSnackBar(`Datos exportados en formato ${format}`);
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorSnackBar(`Error al exportar datos en formato ${format}`);
          this.isLoading = false;
        }
      });
  }

  generateComplianceReport(): void {
    this.dialog.open(ComplianceReportDialogComponent, {
      width: '800px',  // Actualizamos el ancho para coincidir con el nuevo diseño
      panelClass: 'compliance-report-dialog',
      data: {}
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        
        // Incluimos los nuevos campos del formulario
        this.auditService.generateComplianceReport(
          result.templateId,
          result.periodStart,
          result.periodEnd,
          result.format || 'PDF',
          result.includeCharts || false,
          result.includeTimeline || false
        ).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (report) => {
              this.showSuccessSnackBar(`Informe de cumplimiento generado con ID: ${report.id}`);
              
              // Si hay una URL de descarga disponible, abrirla automáticamente
              if (report.file_path) {
                const a = document.createElement('a');
                a.href = report.file_path;
                a.download = `compliance_report_${report.id}.${result.format.toLowerCase()}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
              
              this.isLoading = false;
            },
            error: (error) => {
              this.showErrorSnackBar('Error al generar informe de cumplimiento');
              this.isLoading = false;
            }
          });
      }
    });
  }
  
  viewUserTimeline(userId: number): void {
    this.isLoading = true;
    
    this.auditService.getUserTimeline(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (timeline) => {
          this.dialog.open(UserTimelineDialogComponent, {
            width: '800px',
            data: { timeline }
          });
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorSnackBar('Error al cargar la línea de tiempo del usuario');
          this.isLoading = false;
        }
      });
  }

  // Métodos auxiliares para la UI
  showSuccessSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  showErrorSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Inicializa los gráficos con implementación robusta
   * siguiendo el patrón del commissioner-panel
   */
  private initializeCharts(): void {
    console.log('[AuditPanel] Inicializando gráficos');
    
    // Detectar tema actual
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const subtitleColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e5e7eb';
    
    // Inicializar gráficos de tendencias de transacciones
    this.transactionTrendsChartOptions = {
      series: [{
        name: 'Transacciones',
        data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
      }],
      chart: {
        type: 'area',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 300
        },
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        foreColor: textColor
      },
      xaxis: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'],
        labels: {
          style: {
            colors: Array(10).fill(textColor)
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      colors: ['#3B82F6'], // Azul para transacciones
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          opacityFrom: 0.7,
          opacityTo: 0.2
        }
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: function(val: number) {
            return val.toString();
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad',
          style: {
            color: subtitleColor,
            fontFamily: 'Inter, sans-serif'
          }
        },
        labels: {
          style: {
            colors: textColor
          }
        }
      },
      theme: {
        mode: isDark ? 'dark' : 'light'
      }
    };

    // Inicializar gráficos de distribución de riesgo
    this.riskDistributionChartOptions = {
      series: [44, 55, 13],
      chart: {
        type: 'donut',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 300
        },
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        foreColor: textColor
      },
      labels: ['Bajo Riesgo', 'Medio Riesgo', 'Alto Riesgo'],
      colors: ['#10B981', '#F59E0B', '#EF4444'], // Verde, Amarillo, Rojo
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return Math.round(val) + '%';
        },
        style: {
          colors: [textColor]
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
                },
                color: textColor
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        labels: {
          colors: textColor
        },
        fontFamily: 'Inter, sans-serif'
      },
      theme: {
        mode: isDark ? 'dark' : 'light'
      }
    };

    // Inicializar gráficos de tendencias de alertas
    this.alertsTrendsChartOptions = {
      series: [{
        name: 'Alertas',
        data: [10, 15, 8, 12, 18, 9, 14, 11, 16]
      }],
      chart: {
        type: 'line',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 300
        },
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        foreColor: textColor
      },
      xaxis: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'],
        labels: {
          style: {
            colors: Array(10).fill(textColor)
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      colors: ['#EF4444'], // Rojo para alertas
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: function(val: number) {
            return val.toString();
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad de Alertas',
          style: {
            color: subtitleColor,
            fontFamily: 'Inter, sans-serif'
          }
        },
        labels: {
          style: {
            colors: textColor
          }
        }
      },
      theme: {
        mode: isDark ? 'dark' : 'light'
      }
    };
  }

  /**
   * Actualiza el tema de los gráficos para modo claro/oscuro
   * @param isDark Indica si el tema actual es oscuro
   */
  private updateChartsTheme(isDark: boolean): void {
    console.log(`[AuditPanel] Actualizando tema de gráficos: ${isDark ? 'oscuro' : 'claro'}`);
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const subtitleColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e5e7eb';
    
    try {
      // Actualizar tema para gráfico de tendencias de transacciones
      if (this.transactionTrendsChartOptions) {
        // Actualizar colores de texto y ejes
        if (this.transactionTrendsChartOptions.chart) {
          this.transactionTrendsChartOptions.chart.foreColor = textColor;
        }
        
        // Actualizar colores de cuadrícula
        if (this.transactionTrendsChartOptions.grid) {
          this.transactionTrendsChartOptions.grid.borderColor = gridColor;
        }
        
        // Actualizar colores de ejes X
        if (this.transactionTrendsChartOptions.xaxis && this.transactionTrendsChartOptions.xaxis.labels) {
          this.transactionTrendsChartOptions.xaxis.labels.style = { 
            colors: Array(10).fill(textColor) 
          };
        }
        
        // Actualizar colores de ejes Y
        if (this.transactionTrendsChartOptions.yaxis) {
          if (this.transactionTrendsChartOptions.yaxis.labels) {
            this.transactionTrendsChartOptions.yaxis.labels.style = { colors: textColor };
          }
          if (this.transactionTrendsChartOptions.yaxis.title) {
            this.transactionTrendsChartOptions.yaxis.title.style = { 
              color: subtitleColor,
              fontFamily: 'Inter, sans-serif'
            };
          }
        }
        
        // Asegurar que colors tenga un valor para evitar errores
        if (!this.transactionTrendsChartOptions.colors || this.transactionTrendsChartOptions.colors.length === 0) {
          this.transactionTrendsChartOptions.colors = ['#3B82F6'];
        }
        
        // Actualizar tema general
        this.transactionTrendsChartOptions.theme = {
          mode: isDark ? 'dark' : 'light'
        };
        
        // Actualizar tooltip
        if (this.transactionTrendsChartOptions.tooltip) {
          this.transactionTrendsChartOptions.tooltip.theme = isDark ? 'dark' : 'light';
        }
      }
      
      // Actualizar tema para gráfico de distribución de riesgo
      if (this.riskDistributionChartOptions) {
        if (this.riskDistributionChartOptions.chart) {
          this.riskDistributionChartOptions.chart.foreColor = textColor;
        }
        
        if (this.riskDistributionChartOptions.dataLabels) {
          this.riskDistributionChartOptions.dataLabels.style = { colors: [textColor] };
        }
        
        if (this.riskDistributionChartOptions.legend) {
          this.riskDistributionChartOptions.legend.labels = { colors: textColor };
        }
        
        // Asegurar que colors tenga un valor para evitar errores
        if (!this.riskDistributionChartOptions.colors || this.riskDistributionChartOptions.colors.length === 0) {
          this.riskDistributionChartOptions.colors = ['#10B981', '#F59E0B', '#EF4444'];
        }
        
        // Verificar que plotOptions.pie.donut.labels.total tenga el color correcto
        if (this.riskDistributionChartOptions.plotOptions?.pie?.donut?.labels?.total) {
          this.riskDistributionChartOptions.plotOptions.pie.donut.labels.total.color = textColor;
        }
        
        this.riskDistributionChartOptions.theme = {
          mode: isDark ? 'dark' : 'light'
        };
      }
      
      // Actualizar tema para gráfico de tendencias de alertas
      if (this.alertsTrendsChartOptions) {
        if (this.alertsTrendsChartOptions.chart) {
          this.alertsTrendsChartOptions.chart.foreColor = textColor;
        }
        
        if (this.alertsTrendsChartOptions.grid) {
          this.alertsTrendsChartOptions.grid.borderColor = gridColor;
        }
        
        if (this.alertsTrendsChartOptions.xaxis && this.alertsTrendsChartOptions.xaxis.labels) {
          this.alertsTrendsChartOptions.xaxis.labels.style = { 
            colors: Array(10).fill(textColor) 
          };
        }
        
        if (this.alertsTrendsChartOptions.yaxis) {
          if (this.alertsTrendsChartOptions.yaxis.labels) {
            this.alertsTrendsChartOptions.yaxis.labels.style = { colors: textColor };
          }
          if (this.alertsTrendsChartOptions.yaxis.title) {
            this.alertsTrendsChartOptions.yaxis.title.style = { 
              color: subtitleColor,
              fontFamily: 'Inter, sans-serif'
            };
          }
        }
        
        // Asegurar que colors tenga un valor para evitar errores
        if (!this.alertsTrendsChartOptions.colors || this.alertsTrendsChartOptions.colors.length === 0) {
          this.alertsTrendsChartOptions.colors = ['#EF4444'];
        }
        
        if (this.alertsTrendsChartOptions.tooltip) {
          this.alertsTrendsChartOptions.tooltip.theme = isDark ? 'dark' : 'light';
        }
        
        this.alertsTrendsChartOptions.theme = {
          mode: isDark ? 'dark' : 'light'
        };
      }
    } catch (error) {
      console.error('[AuditPanel] Error al actualizar tema de gráficos:', error);
    }
  }

  /**
   * Configura un observador para detectar cambios en el tema (claro/oscuro)
   * y actualizar las gráficas automáticamente
   */
  private setupThemeObserver(): void {
    console.log('[AuditPanel] Configurando observador de tema');
    let themeChangeTimeout: any = null;
    
    const observer = new MutationObserver((mutations) => {
      // Evitamos múltiples actualizaciones consecutivas
      if (themeChangeTimeout) {
        clearTimeout(themeChangeTimeout);
      }
      
      themeChangeTimeout = setTimeout(() => {
        const isDark = document.documentElement.classList.contains('dark');
        console.log(`[AuditPanel] Cambio de tema detectado: ${isDark ? 'oscuro' : 'claro'}`);
        
        // Actualizar tema una sola vez
        this.updateChartsTheme(isDark);
        
        // Forzar actualización y detección de cambios
        this.cdr.detectChanges();
        
        // Segunda actualización diferida para asegurar renderizado correcto
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 300);
      }, 200);
    });
    
    // Observar cambios en la clase 'dark' del html root
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Métodos para obtener clases CSS según el estado
  getRiskLevelClass(riskScore: number | undefined): string {
    if (!riskScore) return 'bg-gray-100 text-gray-800';
    
    if (riskScore <= 30) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (riskScore <= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  getAlertSeverityClass(severity: string): string {
    switch (severity) {
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING':
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'FAILED':
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'FALSE_POSITIVE': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }
}
