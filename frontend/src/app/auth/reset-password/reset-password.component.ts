import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SuccessDialogComponent } from './success-dialog.component';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatDialogModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token: string = '';
  email: string = '';
  isLoading = true; // Comienza cargando mientras valida el token
  isSubmitting = false;
  invalidToken = false;
  errorMessage = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Crear el formulario
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });

    // Obtener token y email de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      
      console.log('Token:', this.token);
      console.log('Email:', this.email);
      
      if (this.token && this.email) {
        this.validateToken();
      } else {
        this.invalidToken = true;
        this.isLoading = false;
      }
    });
  }

  // Validador personalizado para que las contraseñas coincidan
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mustMatch: true });
      return { mustMatch: true };
    } else {
      return null;
    }
  }

  validateToken() {
    this.isLoading = true;
    this.authService.validateResetToken(this.token, this.email)
      .pipe(
        catchError(error => {
          console.error('Error validando token:', error);
          this.invalidToken = true;
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.valid) {
          this.isLoading = false;
        } else {
          this.invalidToken = true;
          this.isLoading = false;
        }
      });
  }

  // Getter para fácil acceso a los campos del formulario
  get f() {
    return this.resetPasswordForm.controls;
  }

  onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores
    this.resetPasswordForm.markAllAsTouched();
    
    if (this.resetPasswordForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    
    const password = this.resetPasswordForm.get('password')?.value;
    const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;
    
    console.log('Enviando reset password con:', this.token, this.email);
    
    this.authService.resetPassword(this.token, password, confirmPassword, this.email)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.success = true;
          
          // Mostrar diálogo de éxito
          this.dialog.open(SuccessDialogComponent, {
            width: '350px',
            disableClose: true
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al restablecer contraseña:', error);
          this.errorMessage = error.message || 'Error al restablecer la contraseña. Por favor intente de nuevo.';
        }
      });
  }
}