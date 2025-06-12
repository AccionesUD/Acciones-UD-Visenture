// Modelo para las notificaciones basado en el diagrama ER (SettingNotification)
export interface NotificationSettings {
  id: number;
  notify_admin_close_markets: boolean; // Apertura y cierre de mercados
  notify_daily_summary: boolean;       // Resumen diario de operaciones
  notify_orders_executed: boolean;     // Confirmaciones de órdenes ejecutadas
  notify_price_alerts: boolean;        // Alertas de precios específicos
  last_change_time: Date;
}

export interface PriceAlert {
  id: number;
  user_id: number;
  ticker: string;  // Ticker/Símbolo de la acción
  stock_name?: string; // Nombre de la acción (opcional para la interfaz)
  target_price: number; // Precio objetivo
  condition: 'above' | 'below'; // Condición: por encima o por debajo
  active: boolean;
  created_at: Date;
  notified?: boolean; // Si ya se ha notificado
  last_notified?: Date;
}

export interface NotificationMethod {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
}

// Basado en PreferenceAccount del diagrama ER
export interface UserPreferences {
  id: number;
  id_account: number;
  id_setting_notification: number;
  id_setting_operation: number;
  id_setting_briefcase: number;
  language: 'es' | 'en';
  favorite_markets: string[]; // Array de IDs o códigos de mercados favoritos
  favorite_sectors: string[]; // Array de sectores favoritos
  default_order_type: string;
  daily_operations_limit: number;
  confirm_large_orders: boolean;
  notification_methods?: NotificationMethod; // Métodos de notificación preferidos por el usuario
}