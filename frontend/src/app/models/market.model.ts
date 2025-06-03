export interface Market {
  id: string;                   // Identificador único del mercado (por ejemplo: 'NYSE', 'NASDAQ')
  name: string;                 // Nombre completo del mercado
  country: string;              // País donde se ubica el mercado
  currency: string;             // Moneda principal utilizada en el mercado
  status: 'open' | 'closed';    // Estado actual del mercado (abierto/cerrado)
  
  // Campos opcionales para información adicional
  openingTime?: string;         // Hora de apertura del mercado
  closingTime?: string;         // Hora de cierre del mercado
  timezone?: string;            // Zona horaria del mercado
  description?: string;         // Descripción breve del mercado
  iconUrl?: string;             // URL del icono o bandera del país
}