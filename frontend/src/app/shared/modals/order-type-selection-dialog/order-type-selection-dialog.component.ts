import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export interface OrderTypeSelectionData {
  shareSymbol: string;
  orderType: 'buy' | 'sell';
}

@Component({
  selector: 'app-order-type-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatRadioModule,
  ],
  templateUrl:'./order-type-selection-dialog.component.html',
  styleUrls: ['./order-type-selection-dialog.component.css']
})
export class OrderTypeSelectionDialogComponent {
  orderFor: 'self' | 'client' = 'self';

  constructor(
    public dialogRef: MatDialogRef<OrderTypeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderTypeSelectionData
  ) {
    this.dialogRef.addPanelClass('order-type-selection-dialog');
  }

  onConfirm(): void {
    if (this.orderFor === 'self') {
      this.dialogRef.close({ orderFor: 'self' });
    }
    // La opción 'client' está deshabilitada, por lo que no se necesita lógica adicional.
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
