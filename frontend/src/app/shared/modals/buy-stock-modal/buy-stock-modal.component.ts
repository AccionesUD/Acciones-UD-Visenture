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
import { FundsService } from '../../../services/funds.service';
import { AlpacaDataService } from '../../../services/alpaca-data.service';
import { interval, Subscription } from 'rxjs';

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
  isSubmitting = false; // Flag para evitar doble submit
  error: string | null = null;
  successMessage: string | null = null;
  operationResult: BuyResponse | null = null;
  accountBalance: number | null = null;
  currentPrice: number | null = null;
  priceRefreshSub?: Subscription;
  balanceBeforeOrder: number | null = null;
  balanceAfterOrder: number | null = null;
  
  constructor(
    private fb: FormBuilder,
    private buysService: BuysService,
    private fundsService: FundsService,
    private alpacaService: AlpacaDataService,
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
    this.loadAccountBalance(true); // true para guardar el balance inicial
    this.loadCurrentPrice();
    // Refrescar el precio cada minuto
    this.priceRefreshSub = interval(60000).subscribe(() => this.loadCurrentPrice());
  }

  ngOnDestroy(): void {
    this.priceRefreshSub?.unsubscribe();
  }

  loadAccountBalance(isBeforeOrder: boolean = false): void {
    this.fundsService.getAccountBalance().subscribe({
      next: (data) => {
        this.accountBalance = data?.balance ?? null;
        if (isBeforeOrder) {
          this.balanceBeforeOrder = this.accountBalance;
        } else if (this.operationResult) {
          this.balanceAfterOrder = this.accountBalance;
        }
      },
      error: (err) => {
        console.error('[BuyStockModalComponent] Error al cargar el saldo:', err);
        this.accountBalance = null;
      }
    });
  }

  loadCurrentPrice(): void {
    if (!this.data.stock.symbol) return;
    this.alpacaService.getSymbolSnapshot(this.data.stock.symbol).subscribe({
      next: (snapshot) => {
        // Usar el último precio de la barra minuto si existe, si no el de latestTrade, si no el de dailyBar
        let price = null;
        if (snapshot?.minuteBar?.c) {
          price = snapshot.minuteBar.c;
        } else if (snapshot?.latestTrade?.p) {
          price = snapshot.latestTrade.p;
        } else if (snapshot?.dailyBar?.c) {
          price = snapshot.dailyBar.c;
        } else if (snapshot?.latestQuote?.ap) {
          price = snapshot.latestQuote.ap;
        }
        this.currentPrice = price ?? this.data.price ?? null;
        this.data.price = this.currentPrice === null ? undefined : this.currentPrice;
      },
      error: (err) => {
        console.error('[BuyStockModalComponent] Error al obtener precio actual:', err);
        this.currentPrice = this.data.price ?? null;
      }
    });
  }

  get availableBalance(): string {
    if (this.accountBalance === null || this.accountBalance === undefined) return 'No disponible';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(this.accountBalance);
  }
  
  // Calcular la cantidad máxima que puede comprar basado en el saldo disponible
  private calculateMaxQuantity(price: number): number {
    // Aquí deberías obtener el saldo disponible del usuario desde un servicio
    const availableBalance = 10000000; // Ejemplo: 10 millones (deberías reemplazarlo con el saldo real)
    return Math.floor(availableBalance / price);
  }
  
  /**
   * Determina el precio a utilizar para los cálculos basado en el tipo de orden.
   * @returns El precio límite para órdenes 'limit' o 'stop-loss', o el precio de mercado actual para órdenes 'market'.
   */
  get priceForCalculation(): number {
    const orderType = this.buyForm.get('orderType')?.value;
    if (orderType === 'limit' || orderType === 'stop-loss') {
      return this.buyForm.get('limitPrice')?.value || 0;
    }
    return this.currentPrice ?? this.data.price ?? 0;
  }

  /**
   * Calcula el valor total de las acciones sin comisiones.
   */
  get totalValue(): number {
    const quantity = this.buyForm.get('quantity')?.value || 0;
    const price = this.priceForCalculation;
    if (!price || !quantity) return 0;
    return price * quantity;
  }

  /**
   * Calcula la comisión estimada de la aplicación (20% del valor total).
   */
  get estimatedFee(): number {
    return this.totalValue * 0.20;
  }
  
  /**
   * Calcula el costo neto total estimado que el usuario pagará (valor de acciones + comisión).
   */
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
    if (this.buyForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
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
    console.log('[BuyStockModalComponent] Enviando orden de compra:', buyOrder);
    this.processBuyOrder(buyOrder);
  }

  private processBuyOrder(buyOrder: BuyOrder): void {
    this.successMessage = 'Procesando orden de compra...';
    this.buysService.submitBuyOrder(buyOrder).subscribe({
      next: (response) => {
        console.log('[BuyStockModalComponent] Respuesta normalizada de submitBuyOrder:', response);
        this.isLoading = false;
        this.isSubmitting = false;
        this.successMessage = null;
        if (response.success === true) {
          const statusMsg = response.status ? `Estado de la orden: ${response.status}` : '';
          this.successMessage = '¡Orden de compra enviada correctamente! ' + statusMsg;
          if (response.httpStatus === 200 || response.httpStatus === 201) {
            try {
              const audio = new Audio('/assets/sounds/success.mp3');
              audio.volume = 0.2;
              audio.play().catch(() => {});
            } catch (e) {}
          }
          this.operationResult = {
            success: true,
            status: (response.status && ['completed', 'pending'].includes(response.status)) ? response.status : 'completed',
            orderId: response.orderId || response.id,
            filledQuantity: response.filledQuantity || response.qty,
            boughtAt: response.boughtAt || response.limit_price || this.data.price,
            totalAmount: response.totalAmount || (response.qty * (response.limit_price || this.data.price || 0)),
            fee: response.fee || 0,
            submittedAt: response.submittedAt || (response.created_at ? new Date(response.created_at) : new Date()),
            filledAt: response.filledAt || (response.filled_at ? new Date(response.filled_filled_at) : undefined)
          };
          // Consultar el saldo actualizado y mostrarlo
          this.loadAccountBalance(false); // ahora guarda el balance después de la orden
          // NO cerrar el diálogo automáticamente
        } else {
          this.error = response?.message || 'Error al procesar la orden de compra';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isSubmitting = false;
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

  get realOrderTotal(): number | null {
    if (this.balanceBeforeOrder !== null && this.balanceAfterOrder !== null) {
      return this.balanceBeforeOrder - this.balanceAfterOrder;
    }
    return null;
  }

  getOrderQuantity(): number {
    if (this.operationResult && typeof this.operationResult.filledQuantity === 'number' && this.operationResult.filledQuantity > 0) {
      return this.operationResult.filledQuantity;
    }
    return this.buyForm.get('quantity')?.value || 0;
  }

  getOrderPrice(): number {
    return this.currentPrice ?? this.data.price ?? 0;
  }
}