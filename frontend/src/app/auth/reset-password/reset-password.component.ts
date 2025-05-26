import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SuccessDialogComponent } from './success-dialog.component';

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
  isLoading = false; 
  isSubmitting = false;
  invalidToken = false;
  errorMessage = '';
  success = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Inicializar el formulario
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8), 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
    });

    // Obtener el token y email de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      
      console.log('Token recibido:', this.token);
      console.log('Email recibido:', this.email);
      
      if (this.token && this.email) {
        // Guardar el email para usarlo en el servicio de reseteo
        localStorage.setItem('reset_email', this.email);
      } else {
        this.invalidToken = true;
        this.errorMessage = 'Enlace inválido. Falta el token o el email.';
      }
    });
  }

  // Validador personalizado para verificar si las contraseñas coinciden
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  get f() {
    return this.resetPasswordForm.controls;
  }

  openSuccessDialog() {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      panelClass: ['custom-dialog-container', 'mat-elevation-z8']
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { password, confirmPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token, password, confirmPassword)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.openSuccessDialog();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.invalidToken = true;
          this.errorMessage = error.error?.message || 
            'El enlace para restablecer la contraseña no es válido o ha expirado.';
        }
      });
  }
}
