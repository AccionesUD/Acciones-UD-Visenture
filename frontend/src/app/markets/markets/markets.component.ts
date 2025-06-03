import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Market } from '../../models/market.model';
import { MarketServiceService } from '../../services/markets.service';

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './markets.component.html',
  styleUrls: ['./markets.component.css']
})
export class MarketsComponent implements OnInit {
  markets: Market[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private marketService: MarketServiceService, 
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMarkets();
  }

  loadMarkets(): void {
    this.isLoading = true;
    this.error = null;
    this.marketService.getMarkets().subscribe({
      next: (data) => {
        this.markets = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar mercados:', err);
        this.error = 'No se pudieron cargar los mercados. Intente más tarde.'; // Mensaje genérico
        this.isLoading = false;

      }
    });
  }

  // Método para probar el manejo de errores del servicio
  loadMarketsWithError(): void {
    this.isLoading = true;
    this.error = null;
    this.marketService.getMarketsWithError().subscribe({
      next: (data) => {
        this.markets = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error forzado al cargar mercados:', err);
        this.error = err.message || 'Error simulado de API.';
        this.isLoading = false;
      }
    });
  }

  viewMarketDetails(marketId: string): void {
    this.router.navigate(['/markets', marketId]);
  }
  getMarketStatusIcon(status: 'open' | 'closed'): string {
    return status === 'open' ? 'check_circle' : 'cancel';
  }

  getMarketStatusColor(status: 'open' | 'closed'): string {
    return status === 'open' ? 'green' : 'red';
  }
  
  getMarketStatusText(status: 'open' | 'closed'): string {
    return status === 'open' ? 'Abierto' : 'Cerrado';
  }
}
