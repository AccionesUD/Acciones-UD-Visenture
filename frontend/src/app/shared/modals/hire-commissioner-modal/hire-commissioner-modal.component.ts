import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface HireCommissionerData {
  commissioner: {
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-hire-commissioner-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './hire-commissioner-modal.component.html',
  styleUrls: ['./hire-commissioner-modal.component.css']
})
export class HireCommissionerModalComponent {

  constructor(
    public dialogRef: MatDialogRef<HireCommissionerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HireCommissionerData
  ) {
    this.dialogRef.addPanelClass('hire-commissioner-dialog');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}