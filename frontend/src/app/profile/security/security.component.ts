import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../services/profile.service';
import { ProfileNavigationService } from '../../services/profile-navigation.service';
import { ChangePasswordDto } from '../../models/user.model';
import { MustMatch } from '../../helpers/must-match.validator';
import { strongPasswordValidator } from '../../helpers/strong-password.validator';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  formSubmitted = false;
  changeError: string | null = null;
  passwordChanged = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private navigationService: ProfileNavigationService,
    private snackBar: MatSnackBar
  ) {
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
      confirm_password: ['', Validators.required]
    }, {
      validator: MustMatch('current_password', 'confirm_password')
    });
  }

  ngOnInit(): void {
    // Inicialización si se requiere
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.changeError = null;
    this.passwordChanged = false;
    
    // Validación del formulario
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    // Mostrar indicador de carga
    this.isLoading = true;

    // Preparar datos para cambio de contraseña (nombres esperados por el backend)
    const passwordData = {
      currentPassword: this.passwordForm.value.current_password,
      newPassword: this.passwordForm.value.new_password
    };

    // Llamada al servicio
    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success) {
          // Éxito en el cambio de contraseña
          this.passwordChanged = true;
          this.changeError = null;
          this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar', 'snackbar-success']
          });
          this.passwordForm.reset();
          this.formSubmitted = false;
          this.hideCurrentPassword = true;
          this.hideNewPassword = true;
          this.hideConfirmPassword = true;
          setTimeout(() => window.location.reload(), 1200);
        } else {
          // Error según la API o respuesta inesperada
          this.passwordChanged = false;
          this.changeError = response?.message || 'Error al cambiar contraseña';
          this.snackBar.open(this.changeError, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar', 'snackbar-error']
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.passwordChanged = false;
        let errorMsg = 'Error al comunicarse con el servidor';
        if (err?.error?.message) {
          errorMsg = err.error.message;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        this.changeError = errorMsg;
        console.error('Error al cambiar contraseña:', err);
        this.snackBar.open(errorMsg, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar', 'snackbar-error']
        });
      }
    });
  }

  getCurrentPasswordErrorMessage(): string {
    const control = this.passwordForm.get('current_password');
    if (control?.hasError('required')) {
      return 'La contraseña actual es requerida';
    }
    return '';
  }

  getNewPasswordErrorMessage(): string {
    const control = this.passwordForm.get('new_password');
    if (control?.hasError('required')) {
      return 'La nueva contraseña es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (control?.hasError('strongPassword')) {
      return 'La contraseña debe incluir mayúsculas, números y caracteres especiales';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.passwordForm.get('confirm_password');
    if (control?.hasError('required')) {
      return 'Confirme su contraseña';
    }
    if (control?.hasError('mustMatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
  
  // Método para navegar a otra pestaña
  navigateToTab(tabName: string): void {
    this.navigationService.setActiveTab(tabName);
  }
}