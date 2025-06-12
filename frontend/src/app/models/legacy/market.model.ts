// Este modelo se mantiene por compatibilidad, pero se recomienda usar stock.model.ts
export interface Market {
  // Se mantiene esta interfaz por compatibilidad con código existente
  // Pero se recomienda usar Stock de stock.model.ts como modelo principal
  
  symbol: string;               // Equivalente a mic en Stock
  name: string;                 // Equivalente a name_market en Stock
  isActive: boolean;            // Indica si el mercado está activo
  country?: string;             // País donde se ubica el mercado (opcional)
  currency: string;             // Moneda principal utilizada
  status: string;               // Estado del mercado (open, closed)
  price?: number;               // Este campo no se usa para mercados, solo para acciones
  
  // Campos para compatibilidad
  id?: string;                  // Para compatibilidad con el router
  description?: string;         // Descripción generada para mostrar en UI
  openingTime?: string;         // Hora de apertura (formato 'HH:MM')
  closingTime?: string;         // Hora de cierre (formato 'HH:MM')
  timezone?: string;            // Zona horaria
  iconUrl?: string;             // URL del logo
  
  // Campos adicionales
  nextOpeningTime?: string;     // Próxima apertura (ISO timestamp)
  nextClosingTime?: string;     // Próximo cierre (ISO timestamp)
}