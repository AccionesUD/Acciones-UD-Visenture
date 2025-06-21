import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { User } from '../../models/user.model';

export interface UserDetailData {
  user: User;
  isAdmin: boolean;
}

/**
 * Componente para mostrar detalles del usuario
 * Este componente ha sido reimplementado para mejorar la consistencia visual
 * y la experiencia de usuario en la aplicación.
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
  styleUrl: './user-detail-dialog.component.css',
})
export class UserDetailDialogComponent implements OnInit {
  user!: User;
  isAdmin: boolean = false;
  
  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailData
  ) {
    // Configuración para el diálogo
    this.dialogRef.disableClose = false;
    this.dialogRef.addPanelClass('user-detail-dialog');
    
    // Inicialización de propiedades
    if (data) {
      this.user = data.user;
      this.isAdmin = data.isAdmin;
    }
  }
  
  ngOnInit(): void {
    // No necesitamos inicialización adicional ya que 
    // las propiedades se establecen en el constructor
  }


  getRoleLabel(role: string | undefined): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'commissioner': return 'Comisionista';
      case 'client': return 'Cliente';
      default: return 'Desconocido';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  }

  getRoleIcon(role: string | undefined): string {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'commissioner': return 'business_center';
      case 'client': return 'person';
      default: return 'help_outline';
    }
  }
  
  /**
   * Cierra el diálogo sin acciones adicionales
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
  
  /**
   * Cierra el diálogo con acción de editar
   */
  editUser(): void {
    this.dialogRef.close('edit');
  }
  
  isEmailVerified(): boolean {
    return !!this.user.email_verified_at;
  }
  
  getEmailVerificationText(): string {
    return this.user.email_verified_at 
      ? `Verificado el ${new Date(this.user.email_verified_at).toLocaleDateString()}`
      : 'Email no verificado';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
