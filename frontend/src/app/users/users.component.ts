import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, delay } from 'rxjs/operators';

import { User } from '../models/user.model';
import { UserService } from '../services/user.service'; // Asumiendo que existe, si no usar el mock

/**
 * Servicio Mock para usuarios (simula llamadas a API)
 * Este servicio se usará mientras no exista un servicio real
 */
class MockUserService {
  private users: User[] = [
    { id: 1, first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@example.com', phone_number: '3001234567', role: 'client', status: 'active' },
    { id: 2, first_name: 'Ana', last_name: 'Gómez', email: 'ana.gomez@example.com', phone_number: '3109876543', role: 'client', status: 'inactive' },
    { id: 3, first_name: 'Carlos', last_name: 'López', email: 'carlos.lopez@example.com', phone_number: '3205551234', role: 'commissioner', status: 'active' },
    { id: 4, first_name: 'Laura', last_name: 'Díaz', email: 'laura.diaz@example.com', phone_number: '3157654321', role: 'admin', status: 'pending' },
    { id: 5, first_name: 'Pedro', last_name: 'Martínez', email: 'pedro.martinez@example.com', phone_number: '3012348765', role: 'client', status: 'active' },
    { id: 6, first_name: 'María', last_name: 'Rodríguez', email: 'maria.rodriguez@example.com', phone_number: '3209871234', role: 'client', status: 'active' },
    { id: 7, first_name: 'Diego', last_name: 'Fernández', email: 'diego.fernandez@example.com', phone_number: '3154567890', role: 'commissioner', status: 'inactive' },
    { id: 8, first_name: 'Sofía', last_name: 'García', email: 'sofia.garcia@example.com', phone_number: '3002223344', role: 'client', status: 'active' },
    { id: 9, first_name: 'Javier', last_name: 'Torres', email: 'javier.torres@example.com', phone_number: '3187776655', role: 'admin', status: 'active' },
    { id: 10, first_name: 'Valentina', last_name: 'Herrera', email: 'valentina.herrera@example.com', phone_number: '3043332211', role: 'client', status: 'pending' },
    { id: 11, first_name: 'Miguel', last_name: 'Sánchez', email: 'miguel.sanchez@example.com', phone_number: '3102224433', role: 'client', status: 'active' },
    { id: 12, first_name: 'Lucía', last_name: 'Mendoza', email: 'lucia.mendoza@example.com', phone_number: '3209998877', role: 'commissioner', status: 'active' }
  ];

  getUsers(filters?: any): Observable<User[]> {
    let filteredUsers = [...this.users];
    if (filters) {
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
          u.first_name.toLowerCase().includes(searchTerm) || 
          u.last_name.toLowerCase().includes(searchTerm) ||
          u.email.toLowerCase().includes(searchTerm)
        );
      }
      if (filters.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filters.role);
      }
      if (filters.status) {
        filteredUsers = filteredUsers.filter(u => u.status === filters.status);
      }
    }
    return of(filteredUsers).pipe(delay(500)); // Simula latencia de red
  }

  updateUserStatus(userId: number, status: 'active' | 'inactive' | 'pending'): Observable<boolean> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
  
  deleteUser(userId: number): Observable<boolean> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index > -1) {
      this.users.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}

/**
 * Componente de gestión de usuarios
 * Permite listar, filtrar, seleccionar y realizar acciones sobre usuarios
 */
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatMenuModule, MatCheckboxModule, MatDividerModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [MockUserService] // Usar el servicio mock (reemplazar por el real cuando esté disponible)
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  // Propiedades para la tabla
  displayedColumns: string[] = ['select', 'name', 'email', 'role', 'status', 'actions'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  
  // Estado UI
  isLoading = true;
  
  // Filtros
  filterForm: FormGroup;
  roles: string[] = ['admin', 'commissioner', 'client'];
  statuses: string[] = ['active', 'inactive', 'pending'];
  
  // Selección
  selection = new Set<User>(); // Para selección múltiple

  // Referencias a elementos de la vista
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Subject para gestionar subscripciones
  private destroy$ = new Subject<void>();

  /**
   * Constructor del componente
   */
  constructor(
    private fb: FormBuilder,
    private userService: MockUserService, // Inyectar el servicio (mockup por ahora)
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      role: [''],
      status: ['']
    });
  }

  /**
   * Lifecycle hook - OnInit
   * Inicializa el componente y carga los datos
   */
  ngOnInit(): void {
    this.loadUsers();
    
    // Subscribirse a cambios en los filtros
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  /**
   * Lifecycle hook - AfterViewInit
   * Configura el paginador y ordenamiento después de que la vista se inicializa
   */
  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }
  
  /**
   * Lifecycle hook - OnDestroy
   * Limpia las subscripciones al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los usuarios aplicando los filtros actuales
   */
  loadUsers(): void {
    this.isLoading = true;
    
    this.userService.getUsers(this.filterForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.dataSource.data = users;
          this.isLoading = false;
          
          // Re-asignar paginator y sort
          this.configureDataSource();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al cargar usuarios:', err);
          
          // Cargar datos mockup en caso de fallo
          this.loadMockData();
          
          this.snackBar.open('Se están mostrando datos simulados debido a un error de conexión', 'Cerrar', { 
            duration: 5000,
            panelClass: ['bg-amber-100', 'text-amber-800']
          });
        }
      });
  }
  
  /**
   * Configura el dataSource con paginación y ordenamiento
   */
  private configureDataSource(): void {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      // Si aún no están disponibles, esperar un ciclo de detección de cambios
      setTimeout(() => {
        if (this.paginator && this.sort) {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }
      });
    }
  }
  
  /**
   * Carga datos mockup en caso de fallo de conexión al backend
   */
  loadMockData(): void {
    // Lista extendida de usuarios mock para demostración
    const mockUsers: User[] = [
      { id: 1, first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@example.com', phone_number: '3001234567', role: 'client', status: 'active' },
      { id: 2, first_name: 'Ana', last_name: 'Gómez', email: 'ana.gomez@example.com', phone_number: '3109876543', role: 'client', status: 'inactive' },
      { id: 3, first_name: 'Carlos', last_name: 'López', email: 'carlos.lopez@example.com', phone_number: '3205551234', role: 'commissioner', status: 'active' },
      { id: 4, first_name: 'Laura', last_name: 'Díaz', email: 'laura.diaz@example.com', phone_number: '3157654321', role: 'admin', status: 'pending' },
      { id: 5, first_name: 'Pedro', last_name: 'Martínez', email: 'pedro.martinez@example.com', phone_number: '3012348765', role: 'client', status: 'active' },
      { id: 6, first_name: 'María', last_name: 'Rodríguez', email: 'maria.rodriguez@example.com', phone_number: '3209871234', role: 'client', status: 'active' },
      { id: 7, first_name: 'Diego', last_name: 'Fernández', email: 'diego.fernandez@example.com', phone_number: '3154567890', role: 'commissioner', status: 'inactive' },
      { id: 8, first_name: 'Sofía', last_name: 'García', email: 'sofia.garcia@example.com', phone_number: '3002223344', role: 'client', status: 'active' },
      { id: 9, first_name: 'Javier', last_name: 'Torres', email: 'javier.torres@example.com', phone_number: '3187776655', role: 'admin', status: 'active' },
      { id: 10, first_name: 'Valentina', last_name: 'Herrera', email: 'valentina.herrera@example.com', phone_number: '3043332211', role: 'client', status: 'pending' },
      { id: 11, first_name: 'Miguel', last_name: 'Sánchez', email: 'miguel.sanchez@example.com', phone_number: '3102224433', role: 'client', status: 'active' },
      { id: 12, first_name: 'Lucía', last_name: 'Mendoza', email: 'lucia.mendoza@example.com', phone_number: '3209998877', role: 'commissioner', status: 'active' }
    ];
    
    // Aplicar filtros actuales a los datos mock
    let filteredUsers = [...mockUsers];
    const filters = this.filterForm.value;
    
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.first_name.toLowerCase().includes(searchTerm) || 
        u.last_name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.role) {
      filteredUsers = filteredUsers.filter(u => u.role === filters.role);
    }
    
    if (filters.status) {
      filteredUsers = filteredUsers.filter(u => u.status === filters.status);
    }
    
    // Actualizar el datasource con los datos filtrados
    this.dataSource.data = filteredUsers;
    
    // Configurar paginación y ordenamiento
    this.configureDataSource();
  }

  /**
   * Aplica los filtros y recarga los datos
   */
  applyFilters(): void {
    this.loadUsers();
  }

  /**
   * Limpia todos los filtros aplicados
   */
  clearFilters(): void {
    this.filterForm.reset({ name: '', role: '', status: '' });
    this.applyFilters();
  }

  /**
   * Cambia el estado de selección de un usuario
   * @param user Usuario a seleccionar o deseleccionar
   */
  toggleSelection(user: User): void {
    if (this.selection.has(user)) {
      this.selection.delete(user);
    } else {
      this.selection.add(user);
    }
  }

  /**
   * Verifica si todos los usuarios están seleccionados
   * @returns true si todos los usuarios están seleccionados, false en caso contrario
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.size;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  /**
   * Selecciona o deselecciona todos los usuarios
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.add(row));
    }
  }

  /**
   * Abre la vista de edición para un usuario
   * @param user Usuario a editar
   */
  editUser(user: User): void {
    // Lógica para editar usuario (en una aplicación real, podría abrir un modal o navegar a otra ruta)
    this.snackBar.open(`Editando usuario: ${user.first_name} ${user.last_name}`, 'Cerrar', { 
      duration: 2000,
      panelClass: ['bg-blue-100', 'text-blue-800']
    });
  }

  /**
   * Cambia el estado de un usuario
   * @param user Usuario a actualizar
   * @param status Nuevo estado
   */
  changeUserStatus(user: User, status: 'active' | 'inactive' | 'pending'): void {
    if (!user.id) {
      this.snackBar.open('Error: ID de usuario no válido', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-red-100', 'text-red-800'] 
      });
      return;
    }
    
    this.userService.updateUserStatus(user.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open(`Estado de ${user.first_name} actualizado a ${status}`, 'Cerrar', { 
              duration: 2000,
              panelClass: ['bg-green-100', 'text-green-800']
            });
            this.loadUsers(); // Recargar para ver cambios
          } else {
            this.snackBar.open('Error al actualizar estado', 'Cerrar', { 
              duration: 3000,
              panelClass: ['bg-red-100', 'text-red-800']
            });
          }
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          this.snackBar.open('Error al actualizar estado del usuario', 'Cerrar', { 
            duration: 3000,
            panelClass: ['bg-red-100', 'text-red-800']
          });
        }
      });
  }
  
  /**
   * Elimina un usuario específico
   * @param user Usuario a eliminar
   */
  deleteUser(user: User): void {
    if (!user.id) {
      this.snackBar.open('Error: ID de usuario no válido', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-red-100', 'text-red-800']
      });
      return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar al usuario ${user.first_name} ${user.last_name}?`)) {
      this.userService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open(`Usuario ${user.first_name} eliminado`, 'Cerrar', { 
                duration: 2000,
                panelClass: ['bg-green-100', 'text-green-800']
              });
              this.loadUsers(); // Recargar para ver cambios
              this.selection.delete(user); // Remover de la selección si estaba
            } else {
              this.snackBar.open('Error al eliminar usuario', 'Cerrar', { 
                duration: 3000,
                panelClass: ['bg-red-100', 'text-red-800']
              });
            }
          },
          error: (err) => {
            console.error('Error al eliminar usuario:', err);
            this.snackBar.open('Error al eliminar usuario', 'Cerrar', { 
              duration: 3000,
              panelClass: ['bg-red-100', 'text-red-800']
            });
          }
        });
    }
  }

  /**
   * Elimina todos los usuarios seleccionados
   */
  deleteSelectedUsers(): void {
    if (this.selection.size === 0) {
      this.snackBar.open('No hay usuarios seleccionados', 'Cerrar', { 
        duration: 2000,
        panelClass: ['bg-amber-100', 'text-amber-800']
      });
      return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar ${this.selection.size} usuarios seleccionados?`)) {
      // En una implementación real, se enviaría una solicitud al backend
      // Por ahora, simulamos la eliminación
      
      // Eliminamos los usuarios del dataSource manualmente
      const currentData = this.dataSource.data.filter(u => !this.selection.has(u));
      this.dataSource.data = currentData;
      
      this.snackBar.open(`${this.selection.size} usuarios eliminados correctamente`, 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-green-100', 'text-green-800']
      });
      
      // Limpiar selección
      this.selection.clear();
    }
  }
}
