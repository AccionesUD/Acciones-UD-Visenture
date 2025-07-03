import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Stock } from '../../models/stock.model';
import { StocksService } from '../../services/stocks.service';
import { AlpacaDataService } from '../../services/alpaca-data.service';
import { AuthStateService } from '../../services/auth-state.service';
import { EditOpeningTimeDialogComponent } from '../edit-opening-time-dialog/edit-opening-time-dialog.component';

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './markets.component.html',
  styleUrls: ['./markets.component.css']
})
export class MarketsComponent implements OnInit, OnDestroy {
  stocks: Stock[] = [];
  isLoading = true;
  error: string | null = null;
  isInitialized = false;
  private destroy$ = new Subject<void>();

  constructor(
    private stocksService: StocksService,
    private alpacaService: AlpacaDataService,
    private authStateService: AuthStateService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadStocks();
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateStockStatus());
    this.loadCustomOpeningTimesFromStorage();
  }

  private loadCustomOpeningTimesFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const customTimesKey = 'custom_opening_times';
        const storedTimes = JSON.parse(localStorage.getItem(customTimesKey) || '{}');
        Object.entries(storedTimes).forEach(([mic, time]) => {
          const index = this.stocks.findIndex(s => s.mic === mic);
          if (index !== -1) {
            this.stocks[index].custom_opening_time = time as string;
          }
        });
      } catch (error) {
        console.error('Error al cargar horarios personalizados:', error);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStocks(): void {
    this.isLoading = true;
    this.error = null;
    this.stocksService.getStocks().subscribe({
      next: (data) => {
        this.stocks = data;
        this.isInitialized = data.length > 0;
        this.isLoading = false;
        this.updateStockStatus();
        this.loadCustomOpeningTimesFromStorage();
        if (this.stocksService.areMarketsInitialized()) {
          console.log('Los mercados ya están inicializados');
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los mercados. ' + err.message;
        this.isLoading = false;
        console.error('Error al cargar mercados:', err);
      }
    });
  }

  updateStockStatus(): void {
    if (this.stocks.length === 0 || !this.isInitialized) {
      return;
    }
    this.alpacaService.getMarketStatus().subscribe({
      next: (status) => {
        this.stocks = this.stocks.map(stock => ({
          ...stock,
          status: status.is_open ? 'active' : 'inactive',
          is_open: status.is_open
        }));
      },
      error: (err) => {
        console.error('Error al actualizar estado de mercados:', err);
        this.stocks = this.stocks.map(stock => {
          const [openHour, openMinute] = stock.opening_time.split(':').map(Number);
          const [closeHour, closeMinute] = stock.closing_time.split(':').map(Number);
          const isOpen = this.isMarketOpenLocally(openHour, openMinute, closeHour, closeMinute);
          return {
            ...stock,
            status: isOpen ? 'active' : 'inactive',
            is_open: isOpen
          };
        });
      }
    });
  }

  getStatusLabel(stock: Stock): string {
    return stock.is_open ? 'Abierto' : 'Cerrado';
  }

  navigateToStockDetail(stock: Stock): void {
    this.router.navigate(['/markets', stock.mic]);
  }

  private isMarketOpenLocally(openHour: number, openMinute: number, closeHour: number, closeMinute: number): boolean {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
  }

  isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  openEditOpeningTimeDialog(stock: Stock, event: Event): void {
    event.stopPropagation();
    const customOpeningTime = this.stocksService.getCustomOpeningTime(stock.mic);
    const dialogRef = this.dialog.open(EditOpeningTimeDialogComponent, {
      width: '450px',
      data: { market: stock, customOpeningTime }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCustomOpeningTime(stock, result);
      }
    });
  }

  updateCustomOpeningTime(stock: Stock, customTime: string): void {
    this.stocksService.updateCustomOpeningTime(stock.mic, customTime).subscribe({
      next: (updatedStock) => {
        const index = this.stocks.findIndex(s => s.mic === stock.mic);
        if (index !== -1) {
          this.stocks[index] = updatedStock;
        }
        this.snackBar.open(`Horario de apertura de ${stock.name_market} actualizado a ${customTime}`, 'Cerrar', {
          duration: 3000
        });
      },
      error: (err) => {
        console.error('Error al actualizar horario de apertura:', err);
        this.snackBar.open('Error al actualizar el horario de apertura', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getDisplayOpeningTime(stock: Stock): string {
    const customTime = stock.custom_opening_time;
    return customTime || stock.opening_time;
  }
}
