import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserActivityTimeline } from '../../models/audit.model';

export interface UserTimelineDialogData {
  timeline: UserActivityTimeline;
}

@Component({
  selector: 'app-user-timeline-dialog',
  templateUrl: './user-timeline-dialog.component.html',
  styleUrls: ['./user-timeline-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatCardModule,
    MatTooltipModule
  ]
})
export class UserTimelineDialogComponent {
  timeline: UserActivityTimeline;

  constructor(
    public dialogRef: MatDialogRef<UserTimelineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserTimelineDialogData
  ) {
    this.timeline = data.timeline;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getRiskLevelClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getActivityTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'login': return 'login';
      case 'transaction': return 'receipt';
      case 'withdrawal': return 'call_made';
      case 'deposit': return 'call_received';
      case 'profile_update': return 'person';
      case 'password_change': return 'vpn_key';
      case 'failed_login': return 'error_outline';
      default: return 'circle';
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
