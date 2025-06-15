import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

export interface UserDetailData {
  user: any;
  isAdmin: boolean;
}

/**
 * Componente para mostrar detalles del usuario
 * Muestra información detallada de un usuario y opciones para editar
 */
@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './user-detail-dialog.component.html',
})
export class UserDetailDialogComponent implements OnInit {
  user: any;
  isAdmin: boolean = false;
  
  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailData
  ) {}
  
  ngOnInit(): void {
    this.user = this.data.user;
    this.isAdmin = this.data.isAdmin;
  }

  /**
   * Retorna la etiqueta legible de un rol
   */
  getRoleLabel(role: string | undefined): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'commissioner': return 'Comisionista';
      case 'client': return 'Cliente';
      default: return 'Desconocido';
    }
  }
  
  /**
   * Retorna la etiqueta legible de un estado
   */
  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  }
}
