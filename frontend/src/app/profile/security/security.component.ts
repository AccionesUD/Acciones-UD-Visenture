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
      new_password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirm_password: ['', Validators.required]
    }, {
      validator: MustMatch('new_password', 'confirm_password')
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

    // Preparar datos para cambio de contraseña
    const passwordData: ChangePasswordDto = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password,
      confirm_password: this.passwordForm.value.confirm_password
    };

    // Llamada al servicio
    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          // Éxito en el cambio de contraseña
          this.passwordChanged = true;
          this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          // Limpiar formulario
          this.passwordForm.reset();
          this.formSubmitted = false;
          
          // Restaurar visibilidad de contraseñas
          this.hideCurrentPassword = true;
          this.hideNewPassword = true;
          this.hideConfirmPassword = true;
        } else {
          // Error según la API
          this.changeError = response.message || 'Error al cambiar contraseña';
          this.snackBar.open(this.changeError, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        // Error de comunicación o inesperado
        this.isLoading = false;
        this.changeError = 'Error al comunicarse con el servidor';
        console.error('Error al cambiar contraseña:', err);
        this.snackBar.open(this.changeError, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getNewPasswordErrorMessage(): string {
    const passwordControl = this.passwordForm.get('new_password');
    if (passwordControl?.hasError('required')) {
      return 'La nueva contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (passwordControl?.hasError('pattern')) {
      return 'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmControl = this.passwordForm.get('confirm_password');
    if (confirmControl?.hasError('required')) {
      return 'Confirme su contraseña';
    }
    if (confirmControl?.hasError('mustMatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
  
  // Método para navegar a otra pestaña
  navigateToTab(tabName: string): void {
    this.navigationService.setActiveTab(tabName);
  }
}
