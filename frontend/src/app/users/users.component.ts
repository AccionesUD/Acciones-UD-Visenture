import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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

import { User } from '../models/user.model';
// Mockup de servicio de usuarios, reemplazar con el real cuando esté disponible
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

// Servicio Mock para usuarios (simula llamadas a API)
class MockUserService {
  private users: User[] = [
    { id: 1, first_name: 'Juan', last_name: 'Perez', email: 'juan.perez@example.com', phone_number: '3001234567', role: 'client', status: 'active' },
    { id: 2, first_name: 'Ana', last_name: 'Gomez', email: 'ana.gomez@example.com', phone_number: '3109876543', role: 'client', status: 'inactive' },
    { id: 3, first_name: 'Carlos', last_name: 'Lopez', email: 'carlos.lopez@example.com', phone_number: '3205551234', role: 'commissioner', status: 'active' },
    { id: 4, first_name: 'Laura', last_name: 'Diaz', email: 'laura.diaz@example.com', phone_number: '3157654321', role: 'admin', status: 'pending' },
    { id: 5, first_name: 'Pedro', last_name: 'Martinez', email: 'pedro.martinez@example.com', phone_number: '3012348765', role: 'client', status: 'active' },
  ];

  getUsers(filters?: any): Observable<User[]> {
    let filteredUsers = this.users;
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
  providers: [MockUserService] // Usar el servicio mock
})
export class UsersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'name', 'email', 'role', 'status', 'actions'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  isLoading = true;
  filterForm: FormGroup;
  roles: string[] = ['admin', 'commissioner', 'client'];
  statuses: string[] = ['active', 'inactive', 'pending'];
  selection = new Set<User>(); // Para selección múltiple

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private userService: MockUserService, // Inyectar el servicio mock
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      role: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(this.filterForm.value).subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading = false;
        // Re-asignar paginator y sort después de cargar datos si es necesario
        if (this.paginator && this.sort) {
           this.dataSource.paginator = this.paginator;
           this.dataSource.sort = this.sort;
        } else {
          // Si aún no están disponibles, esperar un ciclo de detección de cambios
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset({ name: '', role: '', status: '' });
    this.applyFilters();
  }

  // Métodos para selección
  toggleSelection(user: User): void {
    if (this.selection.has(user)) {
      this.selection.delete(user);
    } else {
      this.selection.add(user);
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.size;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.add(row));
  }

  // Acciones para usuarios
  editUser(user: User): void {
    // Lógica para editar usuario (ej. abrir un modal)
    this.snackBar.open(`Editando usuario: ${user.first_name}`, 'Cerrar', { duration: 2000 });
  }

  changeUserStatus(user: User, status: 'active' | 'inactive' | 'pending'): void {
    this.userService.updateUserStatus(user.id!, status).subscribe(success => {
      if (success) {
        this.snackBar.open(`Estado de ${user.first_name} actualizado a ${status}`, 'Cerrar', { duration: 2000 });
        this.loadUsers(); // Recargar para ver cambios
      } else {
        this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  deleteUser(user: User): void {
    if(confirm(`¿Está seguro de que desea eliminar al usuario ${user.first_name} ${user.last_name}?`)) {
      this.userService.deleteUser(user.id!).subscribe(success => {
        if (success) {
          this.snackBar.open(`Usuario ${user.first_name} eliminado`, 'Cerrar', { duration: 2000 });
          this.loadUsers(); // Recargar para ver cambios
          this.selection.delete(user); // Remover de la selección si estaba
        } else {
          this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Acciones para selección múltiple (ejemplo)
  deleteSelectedUsers(): void {
    if (this.selection.size === 0) {
      this.snackBar.open('No hay usuarios seleccionados', 'Cerrar', { duration: 2000 });
      return;
    }
    if(confirm(`¿Está seguro de que desea eliminar ${this.selection.size} usuarios seleccionados?`)) {
      // Aquí iría la lógica para eliminar múltiples usuarios
      // Por ahora, solo un mensaje y limpiar selección
      this.snackBar.open(`${this.selection.size} usuarios eliminados (simulación)`, 'Cerrar', { duration: 2000 });
      this.selection.clear();
      // En una implementación real, se llamaría a un método del servicio para eliminar en lote
      // y luego se recargarían los usuarios.
      // this.loadUsers(); 
    }
  }
}
