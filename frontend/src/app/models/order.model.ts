// Modelo para el objeto 'share' anidado en la orden
export interface Share {
  id: number;
  symbol: string;
  name_share: string;
  sector: string | null;
  status: string;
  tradable: boolean;
}

// Modelo para el objeto 'commission' anidado
export interface CommissionDetail {
  name: string;
  percent_value: number;
}

// Modelo para el array 'commissions'
export interface Commission {
  commission: CommissionDetail;
  ammount_commission: number;
}

// Modelo principal para la Orden, ajustado a tu backend
export interface Order {
  id: number;
  create_at: string; // La fecha de creación de la orden
  filled_at: string | null;
  canceled_at: string | null;
  expired_at: string | null;
  share: Share; // Objeto anidado con la información de la acción
  side: 'buy' | 'sell';
  type: string;
  limit_price: number | null;
  stop_price: number | null;
  qty: number;
  fill_qyt: number; // Ojo: parece haber una errata en el nombre del campo en el backend ('fill_qyt')
  filled_avg_price: number | null;
  status: string;
  time_in_force: string;
  commissions: Commission[]; // Array de comisiones
  approximate_total: string;
}
