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
import { trigger, transition, style, animate } from '@angular/animations';


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
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ])
    ])
  ]
})
export class MarketDetailComponent implements OnInit {
  market: Market | undefined;
  isLoading = true;
  isLoadingActions = true;
  error: string | null = null;
  marketId: string | null = null;

  // Acciones simuladas para el mercado
  simulatedActions = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 170.34, change: '+1.25%', sector: 'Tecnología' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 280.50, change: '-0.50%', sector: 'Tecnología' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.70, change: '+2.10%', sector: 'Servicios' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.25, change: '+0.75%', sector: 'Tecnología' },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 330.15, change: '-1.20%', sector: 'Servicios' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 780.90, change: '+3.45%', sector: 'Tecnología' }
  ];

  sectoresDisponibles: string[] = ['Tecnología', 'Servicios'];

  filtros = {
    nombre: '',
    sector: '',
    orden: ''
  };

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
    
    this.marketService.getMarketDetails(id).subscribe({
      next: (detailedData) => {
        if (detailedData) {
          // Solo usamos los datos reales que vienen del backend
          this.market = {
            ...detailedData,
            // Añadimos una descripción si no viene del backend
            description: detailedData.description || `${detailedData.name} es un activo que cotiza con el símbolo ${detailedData.symbol} en la divisa ${detailedData.currency}.`
            // No añadimos campos ficticios
          };
          
          setTimeout(() => {
            // Simulamos carga de acciones después de obtener los detalles del mercado
            this.filterActionsByMarket();
            this.isLoadingActions = false;
          }, 1000);
        } else {
          this.error = `No se encontró el mercado con símbolo: ${id}.`;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles del mercado:', err);
        this.error = 'No se pudieron cargar los detalles del mercado. Usando datos básicos.';
        
        // En caso de error, intentamos obtener al menos los datos básicos
        this.marketService.getMarketById(id).subscribe({
          next: (basicData) => {
            if (basicData) {
              this.market = {
                ...basicData,
                // Solo añadimos descripción si es necesario
                description: basicData.description || `${basicData.name} es un activo que cotiza con el símbolo ${basicData.symbol} en la divisa ${basicData.currency}.`
                // No añadimos campos ficticios como openingTime, closingTime, etc.
              };
              this.filterActionsByMarket();
            }
            this.isLoading = false;
            this.isLoadingActions = false;
          },
          error: () => {
            this.error = 'No se pudo conectar con el servidor. Verifique su conexión.';
            this.isLoading = false;
            this.isLoadingActions = false;
          }
        });
      }
    });
  }

  filterActionsByMarket(): void {
    if (!this.market) return;
    
    // Utilizamos el symbol como identificador principal
    if (this.market.symbol.startsWith('A') || this.market.symbol.startsWith('M')) {
      // Si empieza con A o M, mostramos todas las acciones
      this.simulatedActions = this.simulatedActions;
    } else if (this.market.symbol.startsWith('G') || this.market.symbol.startsWith('T')) {
      // Si empieza con G o T, mostramos solo acciones tecnológicas
      this.simulatedActions = this.simulatedActions.filter(action => 
        ['AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA'].includes(action.symbol)
      );
    } else {
      // Para el resto, mostramos solo 3 acciones
      this.simulatedActions = this.simulatedActions.slice(0, 3);
    }
  }

  goBackToMarkets(): void {
    this.router.navigate(['/markets']);
  }
  abrirOperacion(tipo: 'buy' | 'sell', accion: any) {
    console.log(`Operación: ${tipo} - Acción:`, accion);
  }
    // Formatea el precio para mostrar en la UI
  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  }

    // Comprobar si hay filtros aplicados
  hayFiltrosAplicados(): boolean {
    return this.filtros.nombre !== '' || 
           this.filtros.sector !== '' || 
           this.filtros.orden !== '';
  }
  
  // Limpiar todos los filtros
  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      sector: '',
      orden: ''
    };
  }
  
  // Optimización para trackBy con *ngFor
  trackBySymbol(index: number, action: any): string {
    return action.symbol;
  }

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
    switch (this.filtros.orden) {
      case 'nombre_asc':
        acciones.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nombre_desc':
        acciones.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'precio_asc':
        acciones.sort((a, b) => a.price - b.price);
        break;
      case 'precio_desc':
        acciones.sort((a, b) => b.price - a.price);
        break;
      case 'cambio_asc':
        acciones.sort((a, b) => {
          const valorA = parseFloat(a.change.replace('%', ''));
          const valorB = parseFloat(b.change.replace('%', ''));
          return valorA - valorB;
        });
        break;
      case 'cambio_desc':
        acciones.sort((a, b) => {
          const valorA = parseFloat(a.change.replace('%', ''));
          const valorB = parseFloat(b.change.replace('%', ''));
          return valorB - valorA;      });
        break;
    }
      return acciones;
  }


}