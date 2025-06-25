import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AuditTransaction } from '../../models/audit.model';

export interface TransactionDetailData {
  transaction: AuditTransaction;
}

@Component({
  selector: 'app-transaction-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './transaction-detail-dialog.component.html',
  styleUrls: ['./transaction-detail-dialog.component.css']
})
export class TransactionDetailDialogComponent implements OnInit {
  transaction!: AuditTransaction;

  constructor(
    public dialogRef: MatDialogRef<TransactionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionDetailData
  ) {
    this.dialogRef.addPanelClass('transaction-detail-dialog');
    if (data) {
      this.transaction = data.transaction;
    }
  }

  ngOnInit(): void {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  // Helper functions for display
  getTransactionTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'buy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'sell': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'deposit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'withdrawal': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
