import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Market } from '../models/market.model';
import { FinancialDataService, FinancialNews } from '../services/financial-data.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  isLoadingMarkets = true;
  marketError: string | null = null;

  // Simulación de noticias financieras
  financialNews: FinancialNews[] = [
    {
      title: 'Mercados al alza tras anuncios de política monetaria',
      source: 'Financial Times',
      url: '#',
      date: '28 May, 2025',
      summary: 'Los principales índices bursátiles registran ganancias significativas tras los anuncios de la FED.'
    },
    {
      title: 'Nuevas regulaciones para el sector financiero en Europa',
      source: 'Bloomberg',
      url: '#',
      date: '27 May, 2025',
      summary: 'La Unión Europea anuncia un paquete de medidas regulatorias que afectarán a las operaciones financieras.'
    },
    {
      title: 'Tecnológicas lideran recuperación en Wall Street',
      source: 'Reuters',
      url: '#',
      date: '26 May, 2025',
      summary: 'Las acciones de las principales empresas tecnológicas aumentaron un promedio de 3% esta semana.'
    }
  ];
  
  constructor(
    private financialService: FinancialDataService
  ) {}
  ngOnInit(): void {
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    // Cargar noticias financieras desde el nuevo servicio
    this.financialService.getFinancialNews().subscribe({
      next: (news: FinancialNews[]) => {
        if (news && news.length > 0) {
          this.financialNews = news;
        }
        // Si no hay datos, mantenemos los simulados actuales
      },
      error: (err) => {
        console.error('Error al cargar noticias financieras:', err);
        // Mantenemos los datos simulados en caso de error
      }
    });
  }
}
