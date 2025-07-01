import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dark:bg-gray-900 dark:text-white">
      <h2 class="text-xl font-semibold mb-2" mat-dialog-title>
        <mat-icon *ngIf="data.isDestructive" class="text-red-500 mr-2">warning</mat-icon>
        <mat-icon *ngIf="!data.isDestructive" class="text-emerald-500 mr-2">help</mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content>
        <p class="mb-4">{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button 
          mat-button 
          [mat-dialog-close]="false" 
          cdkFocusInitial
          class="mr-2"
        >
          <ng-container>{{ data.cancelText || cancelDefaultText }}</ng-container>
        </button>
        
        <button 
          mat-flat-button 
          [mat-dialog-close]="true"
          [ngClass]="data.isDestructive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'" 
        >
          <ng-container>{{ data.confirmText || confirmDefaultText }}</ng-container>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    mat-dialog-content {
      padding: 0 0 16px 0;
      min-width: 300px;
    }
    
    mat-dialog-actions {
      padding-top: 8px;
      margin-bottom: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  cancelDefaultText: string;
  confirmDefaultText: string;
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Define los textos predeterminados con i18n
    this.cancelDefaultText = $localize`:@@confirmDialog.cancelButton:Cancelar`;
    this.confirmDefaultText = $localize`:@@confirmDialog.confirmButton:Aceptar`;
  }
}
