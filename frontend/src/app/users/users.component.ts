import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { UserDetailDialogComponent } from './user-detail-dialog/user-detail-dialog.component';
import { UserEditDialogComponent } from './user-edit-dialog/user-edit-dialog.component';

import { User, UserFilters, UsersResponse, UserStats, ChartOptions } from '../models/user.model';
import { UsersService } from '../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [    CommonModule,
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,    NgApexchartsModule
  ],
  providers: [UsersService],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  // Propiedades para la tabla
  displayedColumns: string[] = ['select', 'name', 'email', 'role'/*, 'status'*/, 'actions']; // Columna 'status' comentada
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Estado UI
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  showCharts = true; // Podría ser configurable por el usuario

  // Filtros
  filterForm: FormGroup;
  roles: { value: string, label: string }[] = [
    { value: '', label: 'Todos los roles' }
  ];
  // Filtro de estado comentado por falta de endpoint
  // statuses: { value: string, label: string }[] = [
  //   { value: '', label: 'Todos los estados' },
  //   { value: 'active', label: 'Activo' },
  //   { value: 'inactive', label: 'Inactivo' },
  //   { value: 'pending', label: 'Pendiente' }
  // ];

  // Paginación
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0; // MatPaginator usa pageIndex (0-indexed)
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Gráficos
  public roleDistributionChartOptions!: Partial<ChartOptions>;
  public statusDistributionChartOptions!: Partial<ChartOptions>;
  public registrationTrendChartOptions!: Partial<ChartOptions>;

  private destroy$ = new Subject<void>();
  private themeObserver!: MutationObserver;

  constructor(
    private fb: FormBuilder,
    private userService: UsersService, // Corregido: UserService
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      // status: [''] // Filtro de estado comentado
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
    this.loadUserStats();
    this.setupThemeObserver();

    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginator.pageIndex = 0; // Reset paginator to first page
      this.currentPage = 0;
      this.loadUsers();
    });
  }

  ngAfterViewInit(): void {
    // Vincula el paginador y el sort al dataSource
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Si el paginador existe, suscribe a sus cambios de página
    if (this.paginator) {
      this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.currentPage = this.paginator.pageIndex;
        this.pageSize = this.paginator.pageSize;
        this.loadUsers();
      });
    }

    // No es necesario suscribirse al sort.directionChange aquí si matSortChange se maneja en la plantilla
    // y llama a un método que actualiza los datos.
    // Si se usa (matSortChange)="announceSortChange($event)" en la plantilla, es suficiente.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  setupThemeObserver(): void {
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.updateChartThemes();
        }
      });
    });

    this.themeObserver.observe(document.documentElement, { attributes: true });
    // Actualizar tema inicial
    this.updateChartThemes();
  }

  loadUsers(fromRefresh: boolean = false): void {
    this.isLoading = true;
    this.error = null;
    if (fromRefresh) {
      this.selection.clear(); // Limpiar selección al refrescar
    }

    const filters: UserFilters = {
      ...this.filterForm.value,
      page: this.currentPage + 1, // API es 1-indexed
      limit: this.pageSize,
      sort_by: this.sort ? this.sort.active : 'first_name', // Default sort
      sort_order: this.sort ? this.sort.direction : 'asc',
    };

    this.userService.getUsers(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalUsers = response.pagination.total;
        // MatPaginator se actualiza automáticamente si se le asigna el length
        // this.paginator.length = this.totalUsers; // No es necesario si se usa this.totalUsers en el template
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios si es necesario
      },
      error: (err) => {
        this.error = `Error al cargar usuarios: ${err.message || 'Error desconocido'}`;
        this.snackBar.open(this.error, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
        this.dataSource.data = []; // Limpiar datos en caso de error
        this.totalUsers = 0;
        this.cdr.detectChanges();
      }
    });
  }
  loadUserStats(): void {
    this.isLoadingStats = true;
    this.userService.getUserStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats: UserStats) => {
        // Asegurarse de que todos los campos requeridos estén definidos en stats
        const validatedStats: UserStats = {
          total_users: stats.total_users || 0,
          active_users: stats.active_users || 0,
          inactive_users: stats.inactive_users || 0,
          pending_users: stats.pending_users || 0,
          admins_count: stats.admins_count || 0,
          commissioners_count: stats.commissioners_count || 0,
          clients_count: stats.clients_count || 0,
          registrations_by_month: stats.registrations_by_month || [],
          // Opcional: mantener compatibilidad con campos adicionales
          byRole: stats.byRole,
          byStatus: stats.byStatus,
          registrationTrend: stats.registrationTrend
        };
        
        this.initializeCharts(validatedStats);
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open(`Error al cargar estadísticas: ${err.message || 'Error desconocido'}`, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        this.isLoadingStats = false;
        // Inicializar gráficos con datos vacíos o de error
        this.initializeCharts(null);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Carga los roles dinámicamente desde el backend y actualiza el filtro
   */
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roles = [
          { value: '', label: 'Todos los roles' },
          ...roles.map((r: any) => ({ value: r.name, label: r.displayName || r.name }))
        ];
      },
      error: () => {
        // Fallback si falla la carga
        this.roles = [
          { value: '', label: 'Todos los roles' },
          { value: 'admin', label: 'Administrador' },
          { value: 'commissioner', label: 'Comisionista' },
          { value: 'client', label: 'Cliente' }
        ];
      }
    });
  }

  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.currentPage = 0;
    this.loadUsers();
  }

  applyFiltersAndLoad(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', role: '', status: '' });
    // loadUsers() se disparará por el valueChanges
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }
  /** 
  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '800px',
      disableClose: false,
      panelClass: 'user-edit-dialog',
      data: { 
        user: null, 
        isAdmin: true, // Asumiendo que solo los admins pueden crear usuarios
        roles: this.roles,
        statuses: this.statuses
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí iría la lógica para crear el usuario
        this.loadUsers();
        this.loadUserStats();
        this.snackBar.open('Usuario creado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  **/
  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true, // Prevenir cierre accidental
      autoFocus: false, // Evitar el autofocus que puede ser problemático
      panelClass: 'user-edit-dialog',
      data: { 
        user: { ...user }, 
        isAdmin: true, // Asumiendo que solo los admins pueden editar usuarios
        roles: this.roles
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí iría la lógica para actualizar el usuario
        this.loadUsers();
        this.loadUserStats();
        this.snackBar.open('Usuario actualizado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  /** 
  viewUser(user: User): void {
    const dialogRef = this.dialog.open(UserDetailDialogComponent, {
      width: '900px', // Aumentamos el ancho del diálogo
      maxWidth: '95vw', // Limitamos el ancho máximo en pantallas pequeñas
      disableClose: false,
      panelClass: 'user-detail-dialog',
      data: { 
        user: user,
        isAdmin: true // Asumiendo que solo los admins pueden ver detalles completos
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditUserDialog(user);
      }
    });
  }
  
  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Confirmar Eliminación', 
        message: `¿Está seguro de que desea eliminar al usuario ${user.first_name} ${user.last_name}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Aquí iría la lógica para eliminar el usuario
        this.snackBar.open('Usuario eliminado exitosamente.', 'Cerrar', { duration: 3000 });
        this.loadUsers();
        this.loadUserStats();
        this.selection.deselect(user);
      }
    });
  }

  deleteSelectedUsers(): void {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.snackBar.open('No hay usuarios seleccionados para eliminar.', 'Cerrar', { duration: 3000 });
      return;
    }
    // const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    //   width: '400px',
    //   data: { title: 'Confirmar Eliminación Múltiple', message: \`¿Está seguro de que desea eliminar ${selectedUsers.length} usuarios seleccionados?\` }
    // });
    // dialogRef.afterClosed().subscribe(confirmed => {
    //   if (confirmed) {
    //     const idsToDelete = selectedUsers.map(u => u.id!);
    //     this.userService.deleteMultipleUsers(idsToDelete).subscribe({
    //       next: (response) => {
    //         this.snackBar.open(\`${response.count} usuarios eliminados exitosamente.\`, 'Cerrar', { duration: 3000 });
    //         this.loadUsers();
    //         this.loadUserStats();
    //         this.selection.clear();
    //       },
    //       error: (err) => this.snackBar.open(\`Error al eliminar usuarios: ${err.message}\`, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] })
    //     });
    //   }
    // });
    this.snackBar.open(`Funcionalidad "Eliminar ${selectedUsers.length} Usuarios Seleccionados" no implementada completamente.`, 'Cerrar', { duration: 3000 });
  }
  **/

  // --- Métodos para Gráficos ---
  initializeCharts(stats: UserStats | null): void {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#FFFFFF' : '#374151'; // Tailwind text-gray-700 or white
    const gridColor = isDark ? '#4B5563' : '#E5E7EB'; // Tailwind gray-600 or gray-200

    const defaultChartConfig: Partial<ChartOptions> = {
      chart: {
        type: 'donut',
        height: 300,
        foreColor: textColor,
        toolbar: { show: false }
      },
      theme: { mode: isDark ? 'dark' : 'light' },
      dataLabels: { enabled: true, style: { colors: [isDark ? '#374151' : '#FFFFFF'] } }, // Ajustar color de datalabels
      legend: { position: 'bottom', labels: { colors: textColor } },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    };    // Gráfico de Distribución por Rol
    this.roleDistributionChartOptions = {
      ...defaultChartConfig,
      series: stats ? [stats.admins_count || 0, stats.commissioners_count || 0, stats.clients_count || 0] : [0,0,0],
      labels: ['Administradores', 'Comisionistas', 'Clientes'],
      colors: ['#10B981', '#3B82F6', '#F59E0B'],
      title: { text: 'Distribución por Rol', align: 'center', style: { color: textColor } },
    };

    // Gráfico de Distribución por Estado
    this.statusDistributionChartOptions = {
      ...defaultChartConfig,
      series: stats ? [stats.active_users || 0, stats.inactive_users || 0, stats.pending_users || 0] : [0,0,0],
      labels: ['Activos', 'Inactivos', 'Pendientes'],
      colors: ['#22C55E', '#EF4444', '#6B7280'],
      title: { text: 'Distribución por Estado', align: 'center', style: { color: textColor } },
    };    // Gráfico de Tendencia de Registros
    // El servicio devuelve { month: string, count: number }[] en registrations_by_month
    const registrationLabels = stats?.registrations_by_month?.map((r: { month: string, count: number }) => {
      // Formatear el mes para que sea más legible
      const dateObj = new Date(r.month + '-01'); // Asumir que month está en formato 'YYYY-MM'
      return dateObj.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    }) || ['N/A'];
    const registrationCounts = stats?.registrations_by_month?.map((r: { month: string, count: number }) => r.count) || [0];

    this.registrationTrendChartOptions = {
      chart: {
        type: 'area',
        height: 350,
        foreColor: textColor,
        toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } }
      },
      theme: { mode: isDark ? 'dark' : 'light' },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      series: [{ name: 'Nuevos Registros', data: registrationCounts }],
      xaxis: {
        type: 'category',
        categories: registrationLabels, // Usar las etiquetas formateadas
        labels: { style: { colors: textColor } }
      },
      yaxis: { title: { text: 'Cantidad de Registros', style: { color: textColor } }, labels: { style: { colors: textColor } } },
      colors: ['#059669'],
      title: { text: 'Tendencia de Registros Mensuales', align: 'center', style: { color: textColor } },
      grid: { borderColor: gridColor, row: { colors: [isDark ? 'transparent' : '#f3f4f6', 'transparent'], opacity: 0.5 } },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        x: { 
          // No se necesita format si las categorías ya son strings legibles
          // format: 'dd MMM' // Ajustar si es necesario y si las categorías son timestamps
        } 
      },
    };
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  updateChartThemes(): void {
    const isDark = document.documentElement.classList.contains('dark');
    const newThemeMode = isDark ? 'dark' : 'light';
    const textColor = isDark ? '#FFFFFF' : '#374151';
    const gridColor = isDark ? '#4B5563' : '#E5E7EB';

    if (this.roleDistributionChartOptions && this.roleDistributionChartOptions.chart) {
      this.roleDistributionChartOptions = {
        ...this.roleDistributionChartOptions,
        chart: { ...this.roleDistributionChartOptions.chart, foreColor: textColor },
        theme: { ...this.roleDistributionChartOptions.theme, mode: newThemeMode },
        title: { ...this.roleDistributionChartOptions.title, style: { color: textColor } },
        legend: { ...this.roleDistributionChartOptions.legend, labels: { colors: textColor } },
        dataLabels: { ...this.roleDistributionChartOptions.dataLabels, style: { colors: [isDark ? '#374151' : '#FFFFFF'] } },
        tooltip: { ...this.roleDistributionChartOptions.tooltip, theme: newThemeMode }
      };
    }
    if (this.statusDistributionChartOptions && this.statusDistributionChartOptions.chart) {
      this.statusDistributionChartOptions = {
        ...this.statusDistributionChartOptions,
        chart: { ...this.statusDistributionChartOptions.chart, foreColor: textColor },
        theme: { ...this.statusDistributionChartOptions.theme, mode: newThemeMode },
        title: { ...this.statusDistributionChartOptions.title, style: { color: textColor } },
        legend: { ...this.statusDistributionChartOptions.legend, labels: { colors: textColor } },
        dataLabels: { ...this.statusDistributionChartOptions.dataLabels, style: { colors: [isDark ? '#374151' : '#FFFFFF'] } },
        tooltip: { ...this.statusDistributionChartOptions.tooltip, theme: newThemeMode }
      };
    }
    if (this.registrationTrendChartOptions && this.registrationTrendChartOptions.chart) {
      this.registrationTrendChartOptions = {
        ...this.registrationTrendChartOptions,
        chart: { ...this.registrationTrendChartOptions.chart, foreColor: textColor },
        theme: { ...this.registrationTrendChartOptions.theme, mode: newThemeMode },
        title: { ...this.registrationTrendChartOptions.title, style: { color: textColor } },
        xaxis: { ...this.registrationTrendChartOptions.xaxis, labels: { style: { colors: textColor } } },
        yaxis: { 
          ...this.registrationTrendChartOptions.yaxis as ApexYAxis, 
          title: { 
            ...(this.registrationTrendChartOptions.yaxis as ApexYAxis)?.title, 
            style: { color: textColor } 
          }, 
          labels: { style: { colors: textColor } } 
        },
        grid: { ...this.registrationTrendChartOptions.grid, borderColor: gridColor, row: { ...this.registrationTrendChartOptions.grid?.row, colors: [isDark ? 'transparent' : '#f3f4f6', 'transparent'] } },
        tooltip: { ...this.registrationTrendChartOptions.tooltip, theme: newThemeMode }
      };
    }
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  /**
   * Maneja el envío del formulario de filtros.
   * Este método se mantiene para compatibilidad con el botón de filtrar,
   * aunque los filtros se aplican automáticamente gracias a la suscripción a valueChanges.
   */
  public onFilterSubmit(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.currentPage = 0;
    this.applyFiltersAndLoad();
  }


  public announceSortChange(sortState: Sort): void {
    // MatSort se encarga de actualizar this.sort.active y this.sort.direction
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.currentPage = 0;
    this.applyFiltersAndLoad();
  }

  public getFullName(user: User): string {
    return (user.first_name && user.last_name)
      ? `${user.first_name} ${user.last_name}`
      : user.email;
  }


  public getRoleDisplay(role: string | undefined): string {
    if (!role) return 'N/A';
    switch (role) {
      case 'admin': return $localize`:@@role.admin:Administrador`;
      case 'commissioner': return $localize`:@@role.commissioner:Comisionista`;
      case 'client': return $localize`:@@role.client:Cliente`;
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }

  public getStatusDisplay(status: string | undefined): string {
    if (!status) return 'N/A';
    switch (status) {
      case 'active': return $localize`:@@status.active:Activo`;
      case 'inactive': return $localize`:@@status.inactive:Inactivo`;
      case 'pending': return $localize`:@@status.pending:Pendiente`;
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }


  public getRoleClass(role: string | undefined): string {
    if (!role) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    switch (role) {
      case 'admin': return 'bg-sky-100 text-sky-700 dark:bg-sky-600 dark:text-sky-100';
      case 'commissioner': return 'bg-purple-100 text-purple-700 dark:bg-purple-600 dark:text-purple-100';
      case 'client': return 'bg-teal-100 text-teal-700 dark:bg-teal-600 dark:text-teal-100';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    }
  }


  public getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    switch (status) {
      case 'active': return 'status-active-bg status-active-text';
      case 'inactive': return 'status-inactive-bg status-inactive-text';
      case 'pending': return 'status-pending-bg status-pending-text';
      default: return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  }

  public getStatusIndicatorClass(status: string | undefined): string {
    if (!status) return 'text-gray-400';
    switch (status) {
      case 'active': return 'status-active-indicator';
      case 'inactive': return 'status-inactive-indicator';
      case 'pending': return 'status-pending-indicator';
      default: return 'text-gray-400';
    }
  }
}