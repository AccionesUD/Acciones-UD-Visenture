import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { FundsService } from '../../services/funds.service';
import { AddFundsRequest, AccountBalance } from '../../models/payment.model';

@Component({
  selector: 'app-add-funds',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './add-funds.component.html',
  styleUrls: ['./add-funds.component.css']
})
export class AddFundsComponent implements OnInit {
  fundsForm!: FormGroup;
  accountBalance: AccountBalance | null = null;
  isLoading = false;
  submitting = false;
  successAnimation = false;
  errorAnimation = false;
  buttonText = 'Añadir Fondos';
  buttonIcon: 'default' | 'success' | 'error' | 'loading' = 'default';

  constructor(
    private fb: FormBuilder,
    private fundsService: FundsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.loadAccountBalance();
  }

  /**
   * Crea el formulario de agregar fondos (solo monto)
   */
  createForm(): void {
    this.fundsForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(10), Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]]
    });
  }

  /**
   * Carga el saldo de la cuenta
   */
  loadAccountBalance(): void {
    this.isLoading = true;
    this.fundsService.getAccountBalance().subscribe({
      next: (data) => {
        this.accountBalance = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando el saldo:', error);
        this.snackBar.open('Error al cargar información de la cuenta', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.fundsForm.invalid) {
      return;
    }
    const amount = parseFloat(this.fundsForm.value.amount);
    this.submitting = true;
    this.successAnimation = false;
    this.errorAnimation = false;
    this.fundsService.addFunds(amount).subscribe({
      next: (response) => {
        this.submitting = false;
        console.log('[AddFundsComponent] Respuesta recibida en addFunds:', response);
        if (response && response.success === true) {
          this.successAnimation = true;
          this.errorAnimation = false;
          this.snackBar.open(response.message || 'Fondos añadidos exitosamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          setTimeout(() => {
            this.successAnimation = false;
            this.loadAccountBalance();
            this.fundsForm.reset({ amount: '' });
          }, 2000);
        } else {
          this.successAnimation = false;
          this.errorAnimation = true;
          console.error('[AddFundsComponent] Error o respuesta inesperada:', response);
          let errorMsg = response?.message || 'Error al añadir fondos';
          if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('una transacción diaria')) {
            errorMsg = 'Solo puedes realizar una transacción de fondeo por día.';
          }
          this.snackBar.open(errorMsg, 'Cerrar', { 
            duration: 4000,
            panelClass: ['error-snackbar']
          });
          setTimeout(() => {
            this.errorAnimation = false;
          }, 2000);
        }
      },
      error: (error) => {
        this.submitting = false;
        this.successAnimation = false;
        this.errorAnimation = true;
        console.error('[AddFundsComponent] Error en addFunds:', error);
        let errorMsg = 'Error en la transacción';
        if (error?.error?.code === 'DAILY_LIMIT_EXCEEDED' || (error?.error?.message && error.error.message.toLowerCase().includes('una transacción diaria'))) {
          errorMsg = 'Solo puedes realizar una transacción de fondeo por día.';
        } else if (error?.error?.message) {
          errorMsg = error.error.message;
        }
        this.snackBar.open(errorMsg, 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        setTimeout(() => {
          this.errorAnimation = false;
        }, 2000);
      }
    });
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number | undefined): string {
    if (value === undefined) return '$0.00';
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: this.accountBalance?.currency || 'USD' 
    }).format(value);
  }

  /**
   * Verifica si un campo del formulario tiene errores
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.fundsForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }
}