import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BuysService } from '../../../services/buy.service';
import { BuyOrder, BuyResponse } from '../../../models/buy.model';
import { Stock } from '../../../models/portfolio.model';

export interface BuyStockDialogData {
  stock: Stock;
  price?: number; // Precio actual de la acción
  maxQuantity?: number; // Máximo de acciones que puede comprar según su saldo
  clientId?: number; // ID del cliente si la orden es realizada por un comisionista para un cliente
}

@Component({
  selector: 'app-buy-stock-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './buy-stock-modal.component.html',
  styleUrls: ['./buy-stock-modal.component.css']
})
export class BuyStockModalComponent implements OnInit {
  buyForm: FormGroup;
  
  buyOrderTypes = [
    { value: 'market', label: 'Mercado', description: 'Comprar inmediatamente al precio de mercado actual' },
    { value: 'limit', label: 'Límite', description: 'Comprar cuando el precio alcance o sea menor al valor especificado' },
    { value: 'stop-loss', label: 'Stop Loss', description: 'Comprar cuando el precio suba por encima del valor especificado' }
  ];
  
  timeInForceOptions = [
    { value: 'day', label: 'Día', description: 'Válida solo durante el día actual de mercado' },
    { value: 'gtc', label: 'GTC', description: 'Good Till Canceled - Válida hasta que se cancele explícitamente' },
    { value: 'ioc', label: 'IOC', description: 'Immediate or Cancel - Ejecutar inmediatamente o cancelar' }
  ];
  
  maxQuantity: number;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  operationResult: BuyResponse | null = null;
  
  constructor(
    private fb: FormBuilder,
    private buysService: BuysService,
    public dialogRef: MatDialogRef<BuyStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BuyStockDialogData
  ) {
    // Establecer la cantidad máxima que puede comprar basado en el saldo disponible
    this.maxQuantity = data.maxQuantity || this.calculateMaxQuantity(data.price || data.stock.unitValue);
    
    // Inicializar el formulario
    this.buyForm = this.fb.group({
      quantity: [1, [
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.maxQuantity)
      ]],
      orderType: ['market', Validators.required],
      limitPrice: [{ value: data.price || data.stock.unitValue, disabled: true }],
      timeInForce: ['day'],
      extendedHours: [false]
    });
    
    // Suscribirnos a cambios en el campo de cantidad
    this.buyForm.get('quantity')?.valueChanges.subscribe(() => {
      this.validateQuantity();
    });
    
    // Actualizar validators según cambie el tipo de orden
    this.buyForm.get('orderType')?.valueChanges.subscribe((orderType: string) => {
      const limitPriceControl = this.buyForm.get('limitPrice');
      if (!limitPriceControl) return;
      
      if (orderType === 'market') {
        limitPriceControl.disable();
        limitPriceControl.clearValidators();
      } else {
        limitPriceControl.enable();
        limitPriceControl.setValidators([Validators.required, Validators.min(0.01)]);
        this.updatePrices();
      }
      limitPriceControl.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    if (!this.data.price) {
      this.data.price = this.data.stock.unitValue;
    }
  }
  
  // Calcular la cantidad máxima que puede comprar basado en el saldo disponible
  private calculateMaxQuantity(price: number): number {
    // Aquí deberías obtener el saldo disponible del usuario desde un servicio
    const availableBalance = 10000000; // Ejemplo: 10 millones (deberías reemplazarlo con el saldo real)
    return Math.floor(availableBalance / price);
  }
  
  get totalValue(): number {
    const quantity = this.buyForm.get('quantity')?.value || 0;
    return quantity * this.data.price!;
  }
  
  get estimatedFee(): number {
    return this.totalValue * 0.005; // 0.5% de comisión
  }
  
  get estimatedNet(): number {
    return this.totalValue + this.estimatedFee;
  }
  
  validateQuantity(): void {
    const quantityControl = this.buyForm.get('quantity');
    if (!quantityControl) return;
    
    const currentValue = quantityControl.value;
    
    if (currentValue === null || currentValue === undefined || currentValue <= 0) {
      quantityControl.setErrors({ required: true, min: true });
    } else if (currentValue > this.maxQuantity) {
      quantityControl.setErrors({ max: true });
      this.error = `No tiene suficiente saldo para comprar ${currentValue} acciones. El máximo es ${this.maxQuantity}.`;
    } else {
      quantityControl.setErrors(null);
      this.error = null;
    }
    
    this.updatePrices();
  }
  
  updatePrices(): void {
    const orderType = this.buyForm.get('orderType')?.value;
    const limitPriceControl = this.buyForm.get('limitPrice');
    
    if (orderType !== 'market' && limitPriceControl) {
      const currentPrice = this.data.price || this.data.stock.unitValue || 0;
      
      if (orderType === 'limit') {
        // Para compra límite, sugerimos un precio ligeramente inferior (-2%)
        const limitPrice = parseFloat((currentPrice * 0.98).toFixed(2));
        limitPriceControl.setValue(limitPrice);
      } else if (orderType === 'stop-loss') {
        // Para stop loss en compra, sugerimos un precio superior (+5%)
        const stopLossPrice = parseFloat((currentPrice * 1.05).toFixed(2));
        limitPriceControl.setValue(stopLossPrice);
      }
    }
  }
  
  submitBuyOrder(): void {
    if (this.buyForm.invalid) {
      Object.keys(this.buyForm.controls).forEach(key => {
        this.buyForm.get(key)?.markAsTouched();
      });
      this.error = 'Por favor, complete correctamente todos los campos del formulario.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.successMessage = 'Verificando disponibilidad de fondos...';
    const formValues = this.buyForm.value;
    // Crear el objeto BuyOrder según el modelo actualizado
    const buyOrder: BuyOrder = {
      symbol: this.data.stock.symbol,
      qty: formValues.quantity,
      side: 'buy',
      type: formValues.orderType,
      time_in_force: formValues.timeInForce
    };
    if (this.data.clientId) {
      buyOrder.account_commissioner = this.data.clientId.toString();
    }
    if (formValues.orderType !== 'market') {
      buyOrder.limit_price = formValues.limitPrice;
    }
    // Llamar al método que realmente procesa la orden
    this.processBuyOrder(buyOrder);
  }

  private processBuyOrder(buyOrder: BuyOrder): void {
    this.successMessage = 'Procesando orden de compra...';
    this.buysService.submitBuyOrder(buyOrder).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = null;
        // Solo reproducir sonido si el status es 200 o 201
        if (response.status === 200 || response.status === 201) {
          try {
            const audio = new Audio('/assets/sounds/success.mp3');
            audio.volume = 0.2;
            audio.play().catch(() => {});
          } catch (e) {}
        }
        const body = response.body;
        if (body && body.id) {
          this.operationResult = {
            success: true,
            status: body.status || 'pending',
            orderId: body.id,
            filledQuantity: body.qty,
            boughtAt: body.limit_price || this.data.price,
            totalAmount: body.qty * (body.limit_price || this.data.price || 0),
            fee: body.fee || 0,
            submittedAt: body.created_at ? new Date(body.created_at) : new Date(),
            filledAt: body.filled_at ? new Date(body.filled_at) : undefined
          };
          this.successMessage = '¡Orden de compra enviada correctamente!';
        } else {
          this.error = body?.message || 'Error al procesar la orden de compra';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.successMessage = null;
        this.error = err?.error?.message || 'Error de conexión. Por favor, inténtelo de nuevo.';
        console.error('Error en la compra:', err);
      }
    });
  }
  
  cancel(): void {
    this.dialogRef.close();
  }
  
  confirm(): void {
    this.dialogRef.close(this.operationResult);
  }
}