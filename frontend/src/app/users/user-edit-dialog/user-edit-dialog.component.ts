import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * Interfaz para los datos recibidos por el diálogo de edición de usuario
 */
export interface UserEditDialogData {
  user: any;
  isAdmin: boolean;
  roles: { value: string, label: string }[];
  statuses: { value: string, label: string }[];
}

/**
 * Componente para editar datos de un usuario existente o crear uno nuevo
 */
@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-edit-dialog.component.html'
})
export class UserEditDialogComponent implements OnInit {
  userForm: FormGroup;
  isNewUser: boolean;
  user: any;
  roles: { value: string, label: string }[];
  statuses: { value: string, label: string }[];
  isAdmin: boolean;
  
  constructor(
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserEditDialogData,
    private fb: FormBuilder
  ) {
    this.user = this.data.user || {};
    this.isNewUser = !this.user.id;
    this.roles = this.data.roles;
    this.statuses = this.data.statuses;
    this.isAdmin = this.data.isAdmin;
    
    this.userForm = this.fb.group({
      first_name: [this.user.first_name || '', [Validators.required, Validators.maxLength(50)]],
      last_name: [this.user.last_name || '', [Validators.required, Validators.maxLength(50)]],
      email: [this.user.email || '', [Validators.required, Validators.email]],
      phone_number: [this.user.phone_number || '', Validators.pattern('^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$')],
      identity_document: [this.user.identity_document || ''],
      role: [this.user.role || 'client', Validators.required],
      status: [this.user.status || 'active', Validators.required],
      birthdate: [this.user.birthdate ? new Date(this.user.birthdate) : null]
    });
    
    // Deshabilitar campos de rol y estado si no es administrador
    if (!this.isAdmin) {
      this.userForm.get('role')?.disable();
      this.userForm.get('status')?.disable();
    }
  }
  
  ngOnInit(): void {
  }
  
  /**
   * Envía el formulario
   */
  submitForm(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const controlErrors = this.userForm.get(key)?.errors;
        if (controlErrors) {
          this.userForm.get(key)?.markAsTouched();
        }
      });
      return;
    }
    
    // Crear el objeto de usuario a retornar
    const userData = {
      ...this.user,
      ...this.userForm.value
    };
    
    // Si no es admin, restaurar los valores originales para rol y estado
    if (!this.isAdmin) {
      userData.role = this.user.role;
      userData.status = this.user.status;
    }
    
    this.dialogRef.close(userData);
  }
  
  /**
   * Cierra el diálogo sin guardar
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
