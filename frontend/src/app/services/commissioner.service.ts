import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  CommissionerClient, 
  ClientKpi, 
  CommissionSummary, 
  CommissionerStats, 
  CommissionerFilters,
  ClientReportsResponse 
} from '../models/commissioner.model';

@Injectable({
  providedIn: 'root'
})
export class CommissionerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de clientes asignados al comisionista actual
   */
  getAssignedClients(filters?: CommissionerFilters): Observable<CommissionerClient[]> {
    // En producción: return this.http.get<CommissionerClient[]>(`${this.apiUrl}/commissioner/clients`, { params });
    
    // Mock para desarrollo
    return this.getMockClients(filters);
  }

  /**
   * Obtiene los KPIs detallados de un cliente específico
   */
  getClientKpis(clientId: number): Observable<ClientKpi> {
    // En producción: return this.http.get<ClientKpi>(`${this.apiUrl}/commissioner/clients/${clientId}/kpis`);
    
    // Mock para desarrollo
    return of(this.mockClientKpis.find(kpi => kpi.client_id === clientId) || this.mockClientKpis[0]);
  }

  /**
   * Obtiene las comisiones generadas por cliente
   */
  getClientCommissions(clientId?: number, filters?: CommissionerFilters): Observable<CommissionSummary[]> {
    // En producción: return this.http.get<CommissionSummary[]>(`${this.apiUrl}/commissioner/commissions`);
    
    // Mock para desarrollo
    let commissions = [...this.mockCommissions];
    
    if (clientId) {
      commissions = commissions.filter(comm => comm.client_id === clientId);
    }
    
    if (filters?.market) {
      const marketFilter = filters.market!;
      commissions = commissions.filter(comm => {
        return comm.market.toLowerCase() === marketFilter.toLowerCase();
      });
    }
    
    return of(commissions);
  }

  /**
   * Obtiene estadísticas generales para el comisionista
   */
  getCommissionerStats(): Observable<CommissionerStats> {
    // En producción: return this.http.get<CommissionerStats>(`${this.apiUrl}/commissioner/stats`);
    
    // Mock para desarrollo
    return of(this.mockCommissionerStats);
  }

  /**
   * Obtiene un reporte completo para el panel del comisionista
   */
  getCommissionerReport(filters?: CommissionerFilters): Observable<ClientReportsResponse> {
    // En producción: return this.http.get<ClientReportsResponse>(`${this.apiUrl}/commissioner/reports`);
    
    // Mock para desarrollo
    // Obtenemos los clientes de manera observable para evitar el error de getValue()
    return this.getMockClients(filters).pipe(
      map(clients => ({
        success: true,
        data: {
          clients: clients,
          kpis: this.mockClientKpis,
          commissions: this.mockCommissions,
          statistics: this.mockCommissionerStats
        }
      }))
    );
  }

  /**
   * Exporta los datos del reporte en varios formatos
   */
  exportReport(format: 'csv' | 'pdf' | 'excel', filters?: CommissionerFilters): Observable<Blob> {
    // En producción:
    // return this.http.get(`${this.apiUrl}/commissioner/export?format=${format}`, { responseType: 'blob' });
    
    // Mock para desarrollo - Esta función debería implementarse con una librería real de exportación
    console.log(`Exportando en formato: ${format} con filtros:`, filters);
    const mockData = new Blob(['Mock export data'], { type: 'text/plain' });
    return of(mockData);
  }

  /**
   * Genera un mockup de clientes para desarrollo
   */
  private getMockClients(filters?: CommissionerFilters): Observable<CommissionerClient[]> {
    let clients = [...this.mockClients];
    
    // Aplicar filtros si existen
    if (filters?.client_name) {
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(filters.client_name!.toLowerCase())
      );
    }
    
    if (filters?.status) {
      clients = clients.filter(client => client.status === filters.status);
    }
    
    return of(clients).pipe(
      tap(data => console.log('Clientes cargados:', data.length))
    );
  }

  // Datos de muestra para desarrollo
  private mockClients: CommissionerClient[] = [
    {
      id: 1,
      name: 'Pedro Pérez',
      email: 'pedro.perez@example.com',
      phone_number: '+57 300 123 4567',
      registration_date: new Date('2023-01-15'),
      status: 'active',
      total_investment: 15000,
      roi_percentage: 12.5,
      main_assets: ['AAPL', 'MSFT', 'GOOGL'],
      last_operation_date: new Date('2023-06-10')
    },
    {
      id: 2,
      name: 'María González',
      email: 'maria.gonzalez@example.com',
      phone_number: '+57 311 987 6543',
      registration_date: new Date('2023-02-20'),
      status: 'active',
      total_investment: 25000,
      roi_percentage: 9.8,
      main_assets: ['AMZN', 'TSLA', 'NFLX'],
      last_operation_date: new Date('2023-06-05')
    },
    {
      id: 3,
      name: 'Juan Rodríguez',
      email: 'juan.rodriguez@example.com',
      phone_number: '+57 315 555 1234',
      registration_date: new Date('2023-03-10'),
      status: 'inactive',
      total_investment: 8000,
      roi_percentage: -2.3,
      main_assets: ['BABA', 'NIO', 'TSM'],
      last_operation_date: new Date('2023-04-28')
    },
    {
      id: 4,
      name: 'Ana García',
      email: 'ana.garcia@example.com',
      phone_number: '+57 300 777 8888',
      registration_date: new Date('2023-04-05'),
      status: 'active',
      total_investment: 32000,
      roi_percentage: 15.7,
      main_assets: ['V', 'MA', 'PYPL'],
      last_operation_date: new Date('2023-06-12')
    },
    {
      id: 5,
      name: 'Carlos Díaz',
      email: 'carlos.diaz@example.com',
      phone_number: '+57 320 444 5555',
      registration_date: new Date('2023-01-30'),
      status: 'pending',
      total_investment: 5000,
      roi_percentage: 3.2,
      main_assets: ['KO', 'PEP', 'MCD'],
      last_operation_date: new Date('2023-05-20')
    },
    {
      id: 6,
      name: 'Laura Martínez',
      email: 'laura.martinez@example.com',
      phone_number: '+57 310 222 3333',
      registration_date: new Date('2023-05-12'),
      status: 'active',
      total_investment: 18000,
      roi_percentage: 7.9,
      main_assets: ['JNJ', 'PFE', 'UNH'],
      last_operation_date: new Date('2023-06-08')
    }
  ];

  private mockClientKpis: ClientKpi[] = [
    {
      client_id: 1,
      client_name: 'Pedro Pérez',
      total_invested: 15000,
      current_value: 16875,
      roi_percentage: 12.5,
      roi_amount: 1875,
      main_assets: [
        { symbol: 'AAPL', name: 'Apple Inc.', percentage: 40, value: 6750 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', percentage: 35, value: 5906.25 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', percentage: 25, value: 4218.75 }
      ],
      operations_count: 12,
      last_operation_date: new Date('2023-06-10')
    },
    {
      client_id: 2,
      client_name: 'María González',
      total_invested: 25000,
      current_value: 27450,
      roi_percentage: 9.8,
      roi_amount: 2450,
      main_assets: [
        { symbol: 'AMZN', name: 'Amazon.com Inc.', percentage: 30, value: 8235 },
        { symbol: 'TSLA', name: 'Tesla Inc.', percentage: 40, value: 10980 },
        { symbol: 'NFLX', name: 'Netflix Inc.', percentage: 30, value: 8235 }
      ],
      operations_count: 18,
      last_operation_date: new Date('2023-06-05')
    },
    {
      client_id: 3,
      client_name: 'Juan Rodríguez',
      total_invested: 8000,
      current_value: 7816,
      roi_percentage: -2.3,
      roi_amount: -184,
      main_assets: [
        { symbol: 'BABA', name: 'Alibaba Group Holding Limited', percentage: 50, value: 3908 },
        { symbol: 'NIO', name: 'NIO Inc.', percentage: 30, value: 2345 },
        { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Company', percentage: 20, value: 1563 }
      ],
      operations_count: 5,
      last_operation_date: new Date('2023-04-28')
    },
    {
      client_id: 4,
      client_name: 'Ana García',
      total_invested: 32000,
      current_value: 37024,
      roi_percentage: 15.7,
      roi_amount: 5024,
      main_assets: [
        { symbol: 'V', name: 'Visa Inc.', percentage: 35, value: 12958 },
        { symbol: 'MA', name: 'Mastercard Inc.', percentage: 35, value: 12958 },
        { symbol: 'PYPL', name: 'PayPal Holdings Inc.', percentage: 30, value: 11107 }
      ],
      operations_count: 25,
      last_operation_date: new Date('2023-06-12')
    },
    {
      client_id: 5,
      client_name: 'Carlos Díaz',
      total_invested: 5000,
      current_value: 5160,
      roi_percentage: 3.2,
      roi_amount: 160,
      main_assets: [
        { symbol: 'KO', name: 'The Coca-Cola Company', percentage: 40, value: 2064 },
        { symbol: 'PEP', name: 'PepsiCo Inc.', percentage: 30, value: 1548 },
        { symbol: 'MCD', name: 'McDonald\'s Corporation', percentage: 30, value: 1548 }
      ],
      operations_count: 3,
      last_operation_date: new Date('2023-05-20')
    },
    {
      client_id: 6,
      client_name: 'Laura Martínez',
      total_invested: 18000,
      current_value: 19422,
      roi_percentage: 7.9,
      roi_amount: 1422,
      main_assets: [
        { symbol: 'JNJ', name: 'Johnson & Johnson', percentage: 33, value: 6410 },
        { symbol: 'PFE', name: 'Pfizer Inc.', percentage: 33, value: 6410 },
        { symbol: 'UNH', name: 'UnitedHealth Group Inc.', percentage: 34, value: 6602 }
      ],
      operations_count: 15,
      last_operation_date: new Date('2023-06-08')
    }
  ];

  private mockCommissions: CommissionSummary[] = [
    {
      id: 1,
      client_id: 1,
      client_name: 'Pedro Pérez',
      month: 'Junio',
      year: 2023,
      commissions_generated: 150.25,
      operations_count: 3,
      market: 'NYSE',
      status: 'approved'
    },
    {
      id: 2,
      client_id: 1,
      client_name: 'Pedro Pérez',
      month: 'Mayo',
      year: 2023,
      commissions_generated: 215.80,
      operations_count: 5,
      market: 'NASDAQ',
      status: 'paid'
    },
    {
      id: 3,
      client_id: 2,
      client_name: 'María González',
      month: 'Junio',
      year: 2023,
      commissions_generated: 320.50,
      operations_count: 7,
      market: 'NYSE',
      status: 'pending'
    },
    {
      id: 4,
      client_id: 4,
      client_name: 'Ana García',
      month: 'Junio',
      year: 2023,
      commissions_generated: 450.75,
      operations_count: 10,
      market: 'NASDAQ',
      status: 'approved'
    },
    {
      id: 5,
      client_id: 6,
      client_name: 'Laura Martínez',
      month: 'Mayo',
      year: 2023,
      commissions_generated: 185.30,
      operations_count: 4,
      market: 'NYSE',
      status: 'paid'
    },
    {
      id: 6,
      client_id: 2,
      client_name: 'María González',
      month: 'Mayo',
      year: 2023,
      commissions_generated: 275.40,
      operations_count: 6,
      market: 'NASDAQ',
      status: 'paid'
    }
  ];

  private mockCommissionerStats: CommissionerStats = {
    total_clients: 6,
    active_clients: 4,
    total_commissions_month: 920.80,
    total_commissions_year: 3580.60,
    average_roi_clients: 7.8,
    total_investments_managed: 103000,
    top_performing_clients: [
      { client_id: 4, client_name: 'Ana García', roi_percentage: 15.7 },
      { client_id: 1, client_name: 'Pedro Pérez', roi_percentage: 12.5 },
      { client_id: 2, client_name: 'María González', roi_percentage: 9.8 }
    ],
    commissions_by_market: [
      { market: 'NYSE', amount: 480.55, percentage: 52.2 },
      { market: 'NASDAQ', amount: 440.25, percentage: 47.8 }
    ]
  };
}
