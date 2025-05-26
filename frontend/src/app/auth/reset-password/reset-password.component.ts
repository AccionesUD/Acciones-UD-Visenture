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
  isLoading = true;
  isSubmitting = false;
  invalidToken = false;
  errorMessage = '';
  success = false;
  openSuccessDialog() {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      panelClass: ['custom-dialog-container', 'mat-elevation-z8']
    });

    dialogRef.afterClosed().subscribe(() => {
      // Redirigir al usuario a login después de cerrar el diálogo
      this.router.navigate(['/login']);
    });
  }
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }  ngOnInit(): void {
    // Obtener el token de la URL
    this.route.params.subscribe(params => {
      this.token = params['token'];
      
      if (this.token) {
        this.validateToken();
      } else {
        this.router.navigate(['/forgot-password']);
      }
    });

    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
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

  validateToken(): void {
    this.authService.validatePasswordResetToken(this.token)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.invalidToken = !response.valid;
        },
        error: () => {
          this.isLoading = false;
          this.invalidToken = true;
        }
      });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { password, confirmPassword } = this.resetPasswordForm.value;    this.authService.resetPassword(this.token, password, confirmPassword)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.openSuccessDialog();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 
            'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
        }
      });
  }
}
