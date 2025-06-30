import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FundsService } from '../../services/funds.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './transactions-history.component.html',
  styleUrls: ['./transactions-history.component.css']
})
export class TransactionsHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoading = true;
  dataSource = new MatTableDataSource<Transaction>();
  displayedColumns: string[] = ['date_create', 'type_transaction', 'value_transaction', 'status', 'operation_id'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Paginación
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 100];
  totalTransactions = 0;

  private fullTransactionHistory: Transaction[] = [];
  private filteredTransactions: Transaction[] = [];
  private destroy$ = new Subject<void>();

  filterForm: FormGroup;

  constructor(
    private fundsService: FundsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      type: [''],
      status: [''],
      sort: ['date_desc']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      this.applyFiltersAndSorting();
    });
  }

  ngAfterViewInit(): void {
    // No vinculamos el paginador directamente, lo manejaremos manualmente.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.fundsService.getTransactions().subscribe({
      next: (data) => {
        console.log('Datos de transacciones recibidos:', data); // LOG SOLICITADO
        this.fullTransactionHistory = data;
        this.applyFiltersAndSorting(); // Esto ahora también llamará a updateDisplayedTransactions
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el historial de transacciones:', err);
        this.isLoading = false;
        this.snackBar.open('No se pudo cargar el historial de transacciones.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFiltersAndSorting(): void {
    const { type, status, sort } = this.filterForm.value;
    let filteredData = [...this.fullTransactionHistory];

    if (type) {
      filteredData = filteredData.filter(tx => tx.type_transaction === type);
    }
    if (status) {
      filteredData = filteredData.filter(tx => tx.status === status);
    }

    const sortedData = filteredData; // Ya es una copia
    switch (sort) {
      case 'date_desc':
        sortedData.sort((a, b) => new Date(b.date_create).getTime() - new Date(a.date_create).getTime());
        break;
      case 'date_asc':
        sortedData.sort((a, b) => new Date(a.date_create).getTime() - new Date(b.date_create).getTime());
        break;
      case 'amount_desc':
        sortedData.sort((a, b) => b.value_transaction - a.value_transaction);
        break;
      case 'amount_asc':
        sortedData.sort((a, b) => a.value_transaction - b.value_transaction);
        break;
    }

    this.filteredTransactions = sortedData;
    this.totalTransactions = this.filteredTransactions.length;
    this.pageIndex = 0; // Reset to first page on filter change
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.updateDisplayedTransactions();
  }

  updateDisplayedTransactions(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSource.data = this.filteredTransactions.slice(startIndex, endIndex);
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedTransactions();
  }
}