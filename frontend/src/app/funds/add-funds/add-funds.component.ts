import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { FundsService } from '../../services/funds.service';
import { AddFundsRequest, AccountBalance, PaymentMethod } from '../../models/payment.model';

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
    MatSelectModule,
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
  
  // Métodos de pago disponibles
  paymentMethods: { value: PaymentMethod, label: string }[] = [
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'debit_card', label: 'Tarjeta de Débito' },
    { value: 'bank_transfer', label: 'Transferencia Bancaria' },
    { value: 'paypal', label: 'PayPal' }
  ];

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
   * Crea el formulario de agregar fondos
   */
  createForm(): void {
    this.fundsForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(10), Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      payment_method: ['credit_card', Validators.required],
      description: ['']
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

    const request: AddFundsRequest = this.fundsForm.value;
    this.submitting = true;

    this.fundsService.addFunds(request).subscribe({
      next: (response) => {
        this.submitting = false;
        
        if (response.success) {
          // Muestra la animación de éxito
          this.successAnimation = true;
          
          // Muestra un mensaje de éxito
          this.snackBar.open(response.message || 'Fondos añadidos exitosamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Después de un tiempo, quita la animación y resetea el formulario
          setTimeout(() => {
            this.successAnimation = false;
            // Recarga el saldo para mostrar los cambios
            this.loadAccountBalance();
            // Resetea el formulario
            this.fundsForm.reset({
              payment_method: 'credit_card',
              amount: '',
              description: ''
            });
          }, 2000);
        } else {
          // Muestra la animación de error
          this.errorAnimation = true;
          
          this.snackBar.open(response.message || 'Error al añadir fondos', 'Cerrar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          
          // Después de un tiempo, quita la animación
          setTimeout(() => {
            this.errorAnimation = false;
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error añadiendo fondos:', error);
        this.submitting = false;
        
        // Muestra la animación de error
        this.errorAnimation = true;
        
        this.snackBar.open('Error en la transacción', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        
        // Después de un tiempo, quita la animación
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
