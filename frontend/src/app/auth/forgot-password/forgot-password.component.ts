import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { SuccessForgotDialogComponent } from './success-forgot-dialog.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatDialogModule, SuccessForgotDialogComponent],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  success = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }
  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.forgotPassword(this.f['email'].value)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.success = true;
          } else {
            this.errorMessage = response.message || 'Ha ocurrido un error al enviar el correo.';
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