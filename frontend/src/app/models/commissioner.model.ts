/**
 * Modelo para representar un cliente asignado a un comisionista
 */
export interface CommissionerClient {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  registration_date: Date;
  status: 'active' | 'inactive' | 'pending';
  total_investment: number;
  roi_percentage: number;
  main_assets: string[];
  last_operation_date?: Date;
}

/**
 * Modelo para representar las estadísticas y KPIs por cliente
 */
export interface ClientKpi {
  client_id: number;
  client_name: string;
  total_invested: number;
  current_value: number;
  roi_percentage: number;
  roi_amount: number;
  main_assets: {
    symbol: string;
    name: string;
    percentage: number;
    value: number;
  }[];
  operations_count: number;
  last_operation_date: Date;
}

/**
 * Modelo para representar un resumen de comisiones generadas
 */
export interface CommissionSummary {
  id: number;
  client_id: number;
  client_name: string;
  month: string;
  year: number;
  commissions_generated: number;
  operations_count: number;
  market: string;
  status: 'pending' | 'approved' | 'paid';
}

/**
 * Modelo para representar las estadísticas generales del comisionista
 */
export interface CommissionerStats {
  total_clients: number;
  active_clients: number;
  total_commissions_month: number;
  total_commissions_year: number;
  average_roi_clients: number;
  total_investments_managed: number;
  commission_growth: number;           // Crecimiento de comisiones vs mes anterior (porcentaje)
  totalOperations: number;             // Total de operaciones
  clients_with_negative_roi: number;   // Cantidad de clientes con ROI negativo
  top_performing_clients: {
    client_id: number;
    client_name: string;
    roi_percentage: number;
  }[];
  commissions_by_market: {
    market: string;
    amount: number;
    percentage: number;
  }[];
}

/**
 * Modelo para representar los filtros de búsqueda para el panel
 */
export interface CommissionerFilters {
  client_name?: string;
  market?: string;
  asset_type?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
  status?: string;
}

/**
 * Modelo para representar la respuesta de la API con reportes de cliente
 */
export interface ClientReportsResponse {
  success: boolean;
  message?: string;
  data: {
    clients: CommissionerClient[];
    kpis: ClientKpi[];
    commissions: CommissionSummary[];
    statistics: CommissionerStats;
  };
}
