import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { User, ProfileUpdateResponse } from '../../models/user.model';
import { UsersService } from '../../services/user.service';
import { phoneNumberValidator, getValidationErrorMessage } from '../../helpers/must-match.validator';
import { HttpClient } from '@angular/common/http';

export interface UserEditData {
  user: User;
}

/**
 * Componente para editar información del usuario
 * Diseñado para mantener consistencia visual con el diálogo de detalle
 * y usar formularios similares al perfil de información
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
    MatSnackBarModule,
    MatDividerModule,
    MatCardModule
  ],
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.css'
})
export class UserEditDialogComponent implements OnInit {
  editForm: FormGroup;
  user: User;
  isSaving = false;
  formSubmitted = false;
  roles: any[] = [];
  initialRole: any;

  constructor(
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserEditData,
    private fb: FormBuilder,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    // Configuración del diálogo
    this.dialogRef.disableClose = false;
    this.dialogRef.addPanelClass('user-edit-dialog');
    // Inicialización de datos
    this.user = data.user;
    // Crear formulario con valores iniciales y validaciones mejoradas
    this.editForm = this.fb.group({
      first_name: [this.user.first_name, [Validators.required, Validators.minLength(2)]],
      last_name: [this.user.last_name, [Validators.required, Validators.minLength(2)]],
      email: [this.user.email, [Validators.required, Validators.email]],
      // phone_number: [this.user.phone_number || '', [Validators.required, phoneNumberValidator()]],
      // address: [this.user.address || ''],
      role: [this.user.role || null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    if (this.user && this.user.role) {
      this.editForm.patchValue({ role: this.user.role });
      this.initialRole = this.user.role;
    }
  }

  loadRoles(): void {
    this.usersService.getRoles().subscribe({
      next: (roles) => { this.roles = roles; },
      error: () => { this.roles = [
        { id: 1, name: 'admin', displayName: 'Administrador' },
        { id: 2, name: 'commissioner', displayName: 'Comisionista' },
        { id: 3, name: 'client', displayName: 'Cliente' }
      ]; }
    });
  }

  /**
   * Verifica si un campo específico tiene errores y ha sido tocado
   */
  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.editForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.touched || this.formSubmitted);
    }
    return field.invalid && (field.touched || this.formSubmitted);
  }

  /**
   * Obtiene el mensaje de error para un campo específico utilizando nuestro
   * helper de mensajes de error personalizado
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    // Mapeo de campos a nombres amigables para mensajes
    const fieldDisplayNames: {[key: string]: string} = {
      'first_name': 'nombre',
      'last_name': 'apellido',
      'email': 'correo electrónico',
      'phone_number': 'número de teléfono',
      'role': 'rol'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    // Obtener el primer error (clave) del objeto de errores
    const errorType = Object.keys(field.errors)[0];
    
    if (errorType) {
      return getValidationErrorMessage(errorType, displayName);
    }

    return 'Campo inválido';
  }

  /**
   * Guarda los cambios del formulario
   */
  onSave(): void {
    this.formSubmitted = true;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('Por favor, corrige los errores en el formulario', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    if (!this.user.id && !this.user.identity_document) {
      this.snackBar.open('Error: ID de usuario no encontrado', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.isSaving = true;
    const updatedData = this.editForm.value;
    // Solo cambiar el rol usando el endpoint correspondiente
    const userId = typeof this.user.id === 'number' ? this.user.id : undefined;
    console.log('Intentando cambiar rol. userId:', userId, 'Nuevo rol:', updatedData.role);
    if (!userId) {
      this.snackBar.open('Error: ID numérico de usuario no encontrado', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.isSaving = false;
      return;
    }
    this.usersService.changeUserRole(userId, updatedData.role).subscribe({
      next: (resp) => {
        console.log('Respuesta del cambio de rol:', resp);
        this.isSaving = false;
        this.snackBar.open('Rol actualizado con éxito', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close({ ...updatedData });
      },
      error: (error: any) => {
        this.isSaving = false;
        let errorMessage = 'Error al actualizar el rol';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar cambios
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Cancela la edición y cierra el diálogo
   */
  cancelEdit(): void {
    if (this.editForm.dirty) {
      // Mostrar confirmación si hay cambios sin guardar
      const shouldClose = confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.');
      if (shouldClose) {
        this.closeDialog();
      }
    } else {
      this.closeDialog();
    }
  }
}
