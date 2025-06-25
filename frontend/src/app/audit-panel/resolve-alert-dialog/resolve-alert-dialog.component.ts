import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditAlert } from '../../models/audit.model';

export interface ResolveAlertDialogData {
  alert: AuditAlert;
}

@Component({
  selector: 'app-resolve-alert-dialog',
  templateUrl: './resolve-alert-dialog.component.html',
  styleUrls: ['./resolve-alert-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ]
})
export class ResolveAlertDialogComponent {
  resolveForm: FormGroup;
  alert: AuditAlert;

  constructor(
    public dialogRef: MatDialogRef<ResolveAlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResolveAlertDialogData,
    private fb: FormBuilder
  ) {
    this.alert = data.alert;
    this.resolveForm = this.fb.group({
      resolution: ['', [Validators.required, Validators.minLength(10)]],
      falsePositive: [false]
    });
  }

  onSubmit(): void {
    if (this.resolveForm.valid) {
      const status = this.resolveForm.value.falsePositive ? 'FALSE_POSITIVE' : 'RESOLVED';
      
      this.dialogRef.close({
        alertId: this.alert.id,
        resolution: this.resolveForm.value.resolution,
        status: status
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
