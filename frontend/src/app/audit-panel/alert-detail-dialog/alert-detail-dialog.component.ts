import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AuditAlert } from '../../models/audit.model';

export interface AlertDetailData {
  alert: AuditAlert;
}

@Component({
  selector: 'app-alert-detail-dialog',
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
  templateUrl: './alert-detail-dialog.component.html',
  styleUrls: ['./alert-detail-dialog.component.css']
})
export class AlertDetailDialogComponent implements OnInit {
  alert!: AuditAlert;

  constructor(
    public dialogRef: MatDialogRef<AlertDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDetailData
  ) {
    this.dialogRef.addPanelClass('alert-detail-dialog');
    if (data) {
      this.alert = data.alert;
    }
  }

  ngOnInit(): void {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  takeAction(): void {
    this.dialogRef.close({ action: 'take_action', alertId: this.alert.id });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-red-500';
      case 'in_review': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      case 'dismissed': return 'text-gray-500';
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
