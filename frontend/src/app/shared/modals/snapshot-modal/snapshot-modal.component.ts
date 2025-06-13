import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SnapshotData {
  symbol: string;
  latestTrade: { price: number; timestamp: string; size?: number; exchange?: string };
  latestQuote: { bidPrice: number; askPrice: number; bidSize?: number; askSize?: number; timestamp: string };
  dailyBar: any;
  prevDailyBar: any;
}

@Component({
  selector: 'app-snapshot-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule],
  template: `
    <div class="snapshot-dialog-container">
      <h2 mat-dialog-title class="flex justify-between items-center">
        <span class="text-2xl font-bold">{{data.symbol}}</span>
        <button mat-icon-button (click)="dialogRef.close()" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </h2>
      
      <mat-divider></mat-divider>
      
      <div mat-dialog-content class="py-4">
        <!-- Precio y cambio -->
        <div class="flex items-end mb-6">
          <span class="text-3xl font-bold mr-2">{{data.latestTrade.price | currency:'USD':'symbol':'1.2-2'}}</span>
          <span class="text-sm text-gray-500">
            Última actualización: {{data.latestTrade.timestamp | date:'dd/MM/yyyy HH:mm:ss'}}
          </span>
        </div>
        
        <!-- Información de compra/venta -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div class="text-sm text-gray-500 mb-1">Precio de compra (Ask)</div>
            <div class="text-xl font-semibold text-green-700 dark:text-green-400">
              {{data.latestQuote.askPrice | currency:'USD':'symbol':'1.2-2'}}
            </div>
            <div class="text-xs text-gray-500" *ngIf="data.latestQuote.askSize">
              Tamaño: {{data.latestQuote.askSize | number}}
            </div>
          </div>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div class="text-sm text-gray-500 mb-1">Precio de venta (Bid)</div>
            <div class="text-xl font-semibold text-red-700 dark:text-red-400">
              {{data.latestQuote.bidPrice | currency:'USD':'symbol':'1.2-2'}}
            </div>
            <div class="text-xs text-gray-500" *ngIf="data.latestQuote.bidSize">
              Tamaño: {{data.latestQuote.bidSize | number}}
            </div>
          </div>
        </div>
        
        <!-- Datos adicionales -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h3 class="font-medium mb-2">Datos de sesión</h3>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-500">Volumen</span>
                <span class="font-medium">{{data.dailyBar?.volume || data.dailyBar?.v | number}}</span>
              </div>
              <div class="flex justify-between" *ngIf="data.dailyBar?.o">
                <span class="text-gray-500">Apertura</span>
                <span class="font-medium">{{data.dailyBar?.o | currency:'USD':'symbol':'1.2-2'}}</span>
              </div>
              <div class="flex justify-between" *ngIf="data.dailyBar?.h">
                <span class="text-gray-500">Máximo</span>
                <span class="font-medium">{{data.dailyBar?.h | currency:'USD':'symbol':'1.2-2'}}</span>
              </div>
              <div class="flex justify-between" *ngIf="data.dailyBar?.l">
                <span class="text-gray-500">Mínimo</span>
                <span class="font-medium">{{data.dailyBar?.l | currency:'USD':'symbol':'1.2-2'}}</span>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h3 class="font-medium mb-2">Sesión anterior</h3>
            <div class="space-y-1" *ngIf="data.prevDailyBar; else noPrevData">
              <div class="flex justify-between">
                <span class="text-gray-500">Cierre</span>
                <span class="font-medium">{{data.prevDailyBar?.c | currency:'USD':'symbol':'1.2-2'}}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Volumen</span>
                <span class="font-medium">{{data.prevDailyBar?.v | number}}</span>
              </div>
            </div>
            <ng-template #noPrevData>
              <p class="text-gray-500">No hay datos disponibles</p>
            </ng-template>
          </div>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div mat-dialog-actions class="flex justify-between">
        <span class="text-xs text-gray-500">Datos en tiempo real de Alpaca Markets</span>
        <button mat-raised-button color="primary" (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .snapshot-dialog-container {
      max-width: 600px;
      padding: 16px;
    }
    
    .mat-dialog-content {
      max-height: 75vh;
    }
  `]
})
export class SnapshotModalComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<SnapshotModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SnapshotData
  ) {}
  
  ngOnInit(): void {
    console.log('Datos de snapshot:', this.data);
  }
}
