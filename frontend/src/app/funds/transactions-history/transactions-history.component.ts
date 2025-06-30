import { Component, OnInit } from '@angular/core';
import { FundsService } from '../../services/funds.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions-history',
  templateUrl: './transactions-history.component.html',
  styleUrls: ['./transactions-history.component.css'],
  standalone: true,
  imports: []
})
export class TransactionsHistoryComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = true;
  error: string | null = null;

  constructor(private fundsService: FundsService) {}

  ngOnInit() {
    this.fundsService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar transacciones';
        this.loading = false;
        console.error(err);
      }
    });
  }
}