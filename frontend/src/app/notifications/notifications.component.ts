import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  notifications: any[] = []; // This will hold the notifications data

  constructor() { }

  ngOnInit(): void {
    // TODO: Implement logic to fetch notifications from a service
    this.notifications = [
      { id: 1, message: 'Your order #1234 has been filled.', type: 'success', timestamp: new Date() },
      { id: 2, message: 'Price alert for AAPL: reached $150.', type: 'info', timestamp: new Date() },
      { id: 3, message: 'Account balance is low.', type: 'warning', timestamp: new Date() },
    ];
  }

  markAsRead(notificationId: number): void {
    // TODO: Implement logic to mark notification as read
    console.log(`Notification ${notificationId} marked as read.`);
  }

  clearAllNotifications(): void {
    // TODO: Implement logic to clear all notifications
    this.notifications = [];
    console.log('All notifications cleared.');
  }
}
