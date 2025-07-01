/**
 * Importación de tipos necesarios para ApexCharts
 */
import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexStroke,
  ApexLegend,
  ApexMarkers,
  ApexGrid,
  ApexTitleSubtitle,
  ApexTheme,
  ApexResponsive
} from 'ng-apexcharts';

/**
 * Modelo para la representación del perfil de usuario
 */
export interface User {
  id?: number;
  identity_document?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  birthdate?: Date;
  role?: string; // Rol principal (opcional, para compatibilidad)
  roles?: Array<'admin' | 'commissioner' | 'client' | 'usuario_premium' | string>; // Array de roles reales
  status?: 'active' | 'inactive' | 'pending'; // Estados posibles
  password?: string; // Contraseña para creación o actualización
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  address?: string; 
}

/**
 * Tipo para las opciones de configuración de gráficos de ApexCharts
 * Utilizado en componentes que muestran gráficos
 */
export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels?: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  yaxis?: ApexYAxis | ApexYAxis[];
  xaxis?: ApexXAxis;
  fill?: ApexFill;
  tooltip?: ApexTooltip;
  stroke?: ApexStroke;
  legend?: ApexLegend;
  markers?: ApexMarkers;
  grid?: ApexGrid;
  title?: ApexTitleSubtitle;
  colors?: string[];
  responsive?: ApexResponsive[];
  labels?: string[];
  theme?: ApexTheme;
};

/**
 * Datos para actualización de perfil
 */
export interface UpdateProfileDto {
  email?: string;
  phone_number?: string;
  address?: string;
}

/**
 * Datos para cambio de contraseña
 */
export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Respuesta al actualizar perfil
 */
export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data?: User;
}

/**
 * Interface para los filtros de usuario
 */
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Interface para la respuesta paginada de usuarios
 */
export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    current_page: number;
    per_page: number;
    total_pages: number;
  };
  stats?: UserStats; // Opcional: estadísticas incluidas en la respuesta
}

/**
 * Interface para las estadísticas de usuario del componente
 * Esta versión es la estructura esperada desde el backend
 */
export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  pending_users: number;
  admins_count: number;
  commissioners_count: number;
  clients_count: number;
  registrations_by_month: { month: string; count: number }[];
  // Campos adicionales para compatibilidad con el servicio mock
  byRole?: { [key: string]: number };
  byStatus?: { [key: string]: number };
  registrationTrend?: { date: string; count: number }[];
}