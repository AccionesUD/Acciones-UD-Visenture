import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Stock } from '../../models/stock.model';

@Component({
  selector: 'app-edit-opening-time-dialog',
  templateUrl: './edit-opening-time-dialog.component.html',
  styleUrls: ['./edit-opening-time-dialog.component.css'],
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
export class EditOpeningTimeDialogComponent implements OnInit {
  form: FormGroup;
  market: Stock;
  submitted = false;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditOpeningTimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { market: Stock, customOpeningTime: string | null }
  ) {
    this.market = data.market;
    
    // Crear el formulario
    this.form = this.fb.group({
      customOpeningTime: [
        data.customOpeningTime || data.market.opening_time, 
        [
          Validators.required,
          Validators.pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/)
        ]
      ]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    this.submitted = true;
    
    if (this.form.invalid) {
      return;
    }
    
    const customOpeningTime = this.form.get('customOpeningTime')?.value;
    this.dialogRef.close(customOpeningTime);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
