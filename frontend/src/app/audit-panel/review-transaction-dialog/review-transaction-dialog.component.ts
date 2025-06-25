import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditTransaction } from '../../models/audit.model';

export interface ReviewTransactionDialogData {
  transaction: AuditTransaction;
}

@Component({
  selector: 'app-review-transaction-dialog',
  templateUrl: './review-transaction-dialog.component.html',
  styleUrls: ['./review-transaction-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class ReviewTransactionDialogComponent {
  reviewForm: FormGroup;
  transaction: AuditTransaction;

  constructor(
    public dialogRef: MatDialogRef<ReviewTransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewTransactionDialogData,
    private fb: FormBuilder
  ) {
    this.transaction = data.transaction;
    this.reviewForm = this.fb.group({
      notes: [''] // Notas opcionales
    });
  }

  onSubmit(): void {
    this.dialogRef.close({
      transactionId: this.transaction.id,
      notes: this.reviewForm.value.notes
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
