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
import { AuthService } from '../../services/auth.service';
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
  user: User & { accountId?: number };
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
    private http: HttpClient,
    private authService: AuthService
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
      roles: [this.user.roles || [], Validators.required] // Ahora permite múltiples roles
    });
  }

  ngOnInit(): void {
    console.log('[UserEditDialog] ngOnInit - user:', this.user);
    this.loadRoles();
    if (this.user && this.user.role) {
      this.editForm.patchValue({ role: this.user.role });
      this.initialRole = this.user.role;
    }
  }

  loadRoles(): void {
    console.log('[UserEditDialog] loadRoles - solicitando roles...');
    this.usersService.getRoles().subscribe({
      next: (roles) => {
        console.log('[UserEditDialog] loadRoles - roles recibidos:', roles);
        // Mapear a formato amigable si es necesario
        this.roles = roles.map((r: any) => {
          let displayName = r.displayName || r.name;
          switch (r.name) {
            case 'usuario': displayName = 'Usuario estándar'; break;
            case 'comisionista': displayName = 'Comisionista'; break;
            case 'admin': displayName = 'Administrador'; break;
            case 'auditor': displayName = 'Auditor'; break;
            case 'usuario_premium': displayName = 'Usuario premium'; break;
          }
          return { ...r, displayName };
        });
        console.log('[UserEditDialog] loadRoles - roles mapeados:', this.roles);
      },
      error: (err) => {
        console.error('[UserEditDialog] loadRoles - error al cargar roles:', err);
        this.roles = [
          { id: 1, name: 'usuario', displayName: 'Usuario estándar' },
          { id: 2, name: 'comisionista', displayName: 'Comisionista' },
          { id: 3, name: 'admin', displayName: 'Administrador' },
          { id: 4, name: 'auditor', displayName: 'Auditor' },
          { id: 5, name: 'usuario_premium', displayName: 'Usuario premium' }
        ];
      }
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
    // Usar accountId real del usuario
    const accountId = (this.user as any).accountId ?? this.user.accountId ?? this.user.id;
    if (!accountId || isNaN(Number(accountId))) {
      console.warn('[UserEditDialog] onSave - accountId no encontrado o inválido:', accountId, this.user);
      this.snackBar.open('Error: accountId de cuenta no encontrado', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.isSaving = true;
    const updatedData = this.editForm.value;
    const payload = {
      accountId: Number(accountId),
      userId: String(this.user.identity_document ?? this.user.id),
      firstName: updatedData.first_name,
      lastName: updatedData.last_name,
      email: updatedData.email,
      roles: updatedData.roles as string[]
    };
    console.log('[UserEditDialog] onSave - payload a enviar:', payload);
    this.usersService.updateUserAdmin(payload).subscribe({
      next: (resp) => {
        this.isSaving = false;
        console.log('[UserEditDialog] onSave - respuesta backend:', resp);
        this.snackBar.open('Usuario actualizado con éxito', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Si el usuario editado es el mismo que el logueado, actualizamos su estado
        const currentUser = this.authService.currentUser;
        if (currentUser && currentUser.id === String(resp.accountId)) {
          // Si la respuesta incluye un nuevo token, usar el nuevo método para actualizar todo
          if (resp.token) {
            this.authService.updateUserTokenAndData(resp.token);
            console.log('[UserEditDialog] onSave - Token y datos de usuario actualizados.');
          } else {
            // Si no hay token, mantener el comportamiento anterior
            this.authService.updateCurrentUserData({
              roles: resp.roles,
              name: `${resp.firstName} ${resp.lastName}`,
              email: resp.email
            });
            console.log('[UserEditDialog] onSave - Datos de usuario actualizados (sin token nuevo).');
          }
        }

        this.dialogRef.close({ ...resp });
      },
      error: (error: any) => {
        this.isSaving = false;
        let errorMessage = 'Error al actualizar el usuario';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        console.error('[UserEditDialog] onSave - error backend:', error);
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

  /**
   * Maneja el cambio de selección de roles (checkbox múltiple)
   */
  onRoleCheckboxChange(event: Event, roleName: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    const currentRoles: string[] = this.editForm.value.roles || [];
    console.log('[UserEditDialog] onRoleCheckboxChange - antes:', currentRoles, 'checked:', checked, 'role:', roleName);
    if (checked) {
      if (!currentRoles.includes(roleName)) {
        this.editForm.patchValue({ roles: [...currentRoles, roleName] });
      }
    } else {
      this.editForm.patchValue({ roles: currentRoles.filter(r => r !== roleName) });
    }
    this.editForm.get('roles')?.markAsTouched();
    console.log('[UserEditDialog] onRoleCheckboxChange - después:', this.editForm.value.roles);
  }
}
