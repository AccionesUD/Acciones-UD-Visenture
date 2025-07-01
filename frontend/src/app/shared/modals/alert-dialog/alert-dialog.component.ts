import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AlertDialogData {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  buttonText?: string;
}

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 max-w-lg bg-emerald-200 dark:bg-slate-700 rounded-xl">
      <!-- Encabezado -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold" 
            [ngClass]="{
              'text-gray-900 dark:text-gray-100': !data.type || data.type === 'info',
              'text-yellow-700 dark:text-yellow-300': data.type === 'warning',
              'text-red-700 dark:text-red-300': data.type === 'error',
              'text-emerald-700 dark:text-emerald-300': data.type === 'success'
            }">
          {{ data.title }}
        </h2>
        <button mat-icon-button (click)="close()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" matTooltip="Cerrar" i18n-matTooltip="@@alertDialogCloseButton">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <!-- Contenido -->
      <div class="mb-6">
        <div class="flex items-start">
          <mat-icon class="mr-3 mt-0.5"
                   [ngClass]="{
                     'text-blue-500 dark:text-blue-400': !data.type || data.type === 'info',
                     'text-yellow-500 dark:text-yellow-400': data.type === 'warning',
                     'text-red-500 dark:text-red-400': data.type === 'error',
                     'text-emerald-500 dark:text-emerald-400': data.type === 'success'
                   }">
            {{ !data.type || data.type === 'info' ? 'info' : 
               data.type === 'warning' ? 'warning' :
               data.type === 'error' ? 'error' : 'check_circle' }}
          </mat-icon>
          <p class="text-gray-700 dark:text-gray-300">{{ data.message }}</p>
        </div>
      </div>
        <!-- Botón de acción -->
      <div class="flex justify-end">
        <button 
          mat-raised-button
          (click)="close()" 
          [ngClass]="{
            'bg-blue-600 hover:bg-blue-700 text-white info-button': !data.type || data.type === 'info',
            'bg-yellow-600 hover:bg-yellow-700 text-white warning-button': data.type === 'warning',
            'bg-red-600 hover:bg-red-700 text-white error-button': data.type === 'error',
            'bg-emerald-600 hover:bg-emerald-700 text-white success-button': data.type === 'success'
          }"
          class="text-white">
          {{ data.buttonText || 'Aceptar' }}
        </button>
      </div>
    </div>
  `,  styles: [`
    :host {
      display: block;
    }
    
    :host ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: transparent;
    }
    
    :host ::ng-deep .success-button.mat-mdc-raised-button {
      background-color: #10B981;
    }
    
    :host ::ng-deep .info-button.mat-mdc-raised-button {
      background-color: #0EA5E9;
    }
    
    :host ::ng-deep .warning-button.mat-mdc-raised-button {
      background-color: #F59E0B;
    }
    
    :host ::ng-deep .error-button.mat-mdc-raised-button {
      background-color: #EF4444;
    }

    :host ::ng-deep .mat-icon{
      overflow: visible;
    }
  `]
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
