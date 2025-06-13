// Modelo para la entidad mercados en el backend
export interface Stock {
  mic: string;              // Market Identifier Code (identificador único)
  name_market: string;      // Nombre del mercado
  country_region: string;   // País o región del mercado
  logo?: string;            // URL del logo del mercado (opcional)
  opening_time: string;     // Hora de apertura (formato 'HH:MM')
  closing_time: string;     // Hora de cierre (formato 'HH:MM')
  days_operation: string;   // Días de operación (ej: 'Lunes a Viernes')
  status?: 'active' | 'inactive'; // Estado del mercado
  is_open?: boolean;        // Indica si el mercado está abierto actualmente
}

// Modelo para la respuesta de inicialización de mercados
export interface StockInitResponse {
  message: string;
  creado_o_actualizado: string[];
  errores: string[];
  count?: number;           // Número de mercados inicializados
}

// Modelo para la información de horario del mercado desde Alpaca
export interface MarketClock {
  timestamp: string;        // Timestamp en formato ISO
  is_open: boolean;         // Si el mercado está abierto
  next_open: string;        // Próxima apertura (timestamp ISO)
  next_close: string;       // Próximo cierre (timestamp ISO)
}

// Modelo para el calendario del mercado (días festivos, etc.)
export interface MarketCalendarDay {
  date: string;             // Fecha en formato 'YYYY-MM-DD'
  open: string;             // Hora de apertura 'HH:MM'
  close: string;            // Hora de cierre 'HH:MM'
  session_open: boolean;    // Indica si la sesión está abierta ese día
  primary_exchange: string; // Nombre del exchange primario
}
