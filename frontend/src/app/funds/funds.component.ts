import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { AddFundsComponent } from './add-funds/add-funds.component';
import { TransactionsHistoryComponent } from './transactions-history/transactions-history.component';

@Component({
  selector: 'app-funds',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, AddFundsComponent, TransactionsHistoryComponent],
  templateUrl: './funds.component.html',
  styleUrls: ['./funds.component.css']
})
export class FundsComponent {
  
}