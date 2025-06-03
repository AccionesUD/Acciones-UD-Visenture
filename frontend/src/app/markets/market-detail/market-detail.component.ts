import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Market } from '../../models/market.model';
import { MarketServiceService } from '../../services/markets.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-market-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
    FormsModule
  ],
  templateUrl: './market-detail.component.html',
})
export class MarketDetailComponent implements OnInit {
  market: Market | undefined;
  isLoading = true;
  error: string | null = null;
  marketId: string | null = null;

  // Acciones simuladas para el mercado
  simulatedActions = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 170.34, change: '+1.25%',sector: 'Tecnología' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 280.50, change: '-0.50%',sector: 'Bienes' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.70, change: '+2.10%',sector: 'Servicios' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.25, change: '+0.75%',sector: 'Tecnología' },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 330.15, change: '-1.20%',sector: 'Servicios' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 780.90, change: '+3.45%',sector: 'Tecnología' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private marketService: MarketServiceService
  ) { }

  ngOnInit(): void {
    this.marketId = this.route.snapshot.paramMap.get('id');
    if (this.marketId) {
      this.loadMarketDetails(this.marketId);
    } else {
      this.error = 'No se proporcionó un ID de mercado.';
      this.isLoading = false;
    }
  }

  loadMarketDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.marketService.getMarketById(id).subscribe({
      next: (data) => {
        if (data) {
          this.market = data;
          // Filtrar acciones simuladas según el mercado
          this.filterActionsByMarket();
        } else {
          this.error = `No se encontró el mercado con ID: ${id}.`;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles del mercado:', err);
        this.error = 'No se pudieron cargar los detalles del mercado.';
        this.isLoading = false;
      }
    });
  }

  filterActionsByMarket(): void {
    if (!this.market) return;
    
    if (this.market.id === 'NYSE' || this.market.id === '1') {
    } else if (this.market.id === 'NASDAQ' || this.market.id === '2') {
      this.simulatedActions = this.simulatedActions.filter(action => 
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(action.symbol)
      );
    } else {
      this.simulatedActions = this.simulatedActions.slice(0, 3);
    }
  }

  goBackToMarkets(): void {
    this.router.navigate(['/markets']);
  }

  abrirOperacion(tipo: 'buy' | 'sell', accion: any) {
    console.log(`Operación: ${tipo} - Acción:`, accion);
  }

  filtros = {
    nombre: '',
    sector: '',
    orden: ''
  };

sectoresDisponibles: string[] = ['Tecnología', 'Salud', 'Finanzas', 'Energía'];

get accionesFiltradas() {
  let acciones = [...this.simulatedActions];

  // Filtrar por nombre
  if (this.filtros.nombre) {
    acciones = acciones.filter(a =>
      a.name.toLowerCase().includes(this.filtros.nombre.toLowerCase())
    );
  }

  // Filtrar por sector
  if (this.filtros.sector) {
    acciones = acciones.filter(a => a.sector === this.filtros.sector);
  }

  // Ordenar
  if (this.filtros.orden === 'nombre') {
    acciones.sort((a, b) => a.name.localeCompare(b.name));
  } else if (this.filtros.orden === 'precio') {
    acciones.sort((a, b) => b.price - a.price);
  }

  return acciones;
}


}