import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditTransaction } from '../../models/audit.model';

export interface FlagTransactionDialogData {
  transaction: AuditTransaction;
}

@Component({
  selector: 'app-flag-transaction-dialog',
  templateUrl: './flag-transaction-dialog.component.html',
  styleUrls: ['./flag-transaction-dialog.component.css'],
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
export class FlagTransactionDialogComponent {
  flagForm: FormGroup;
  transaction: AuditTransaction;

  constructor(
    public dialogRef: MatDialogRef<FlagTransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FlagTransactionDialogData,
    private fb: FormBuilder
  ) {
    this.transaction = data.transaction;
    this.flagForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.flagForm.valid) {
      this.dialogRef.close({
        transactionId: this.transaction.id,
        reason: this.flagForm.value.reason
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
