export interface AuditTransaction {
  id: number;
  id_account: number;
  value_transaction: number;
  date_transaction: Date;
  type_transaction: string;
  status: string;
  risk_score?: number;
  is_suspicious?: boolean;
  flagged_reason?: string;
  reviewed?: boolean;
  reviewed_by?: number;
  reviewed_at?: Date;
  notes?: string;
  // Datos adicionales del usuario y cuenta
  user_name?: string;
  user_email?: string;
  account_type?: string;
}

export interface AuditAlert {
  id: number;
  transaction_id?: number;
  user_id?: number;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  created_at: Date;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  assigned_to?: number;
  resolved_at?: Date;
  resolution_notes?: string;
}

export interface AuditNotification {
  id: number;
  notify_open_close_markets: boolean;
  notify_daily_summary: boolean;
  notify_big_operations: boolean;
  notify_price_alerts: boolean;
  last_change_time: Date;
}

export interface AuditFilters {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: number;
  accountId?: number;
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  suspiciousOnly?: boolean;
  reviewedOnly?: boolean;
  alertType?: string;
  alertSeverity?: string;
  alertStatus?: string;
  searchText?: string;
}

export interface AuditStats {
  totalTransactions: number;
  suspiciousTransactions: number;
  totalAlerts: number;
  openAlerts: number;
  highRiskTransactions: number;
  averageRiskScore: number;
  totalVolume: number;
  uniqueUsers: number;
}

export interface ComplianceReport {
  id: number;
  report_type: string;
  generated_at: Date;
  generated_by: number;
  period_start: Date;
  period_end: Date;
  file_path?: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  template_id?: number;
}

export interface ComplianceTemplate {
  id: number;
  name: string;
  description: string;
  template_type: string;
  regulations: string[];
  fields: string[];
  created_at: Date;
  updated_at: Date;
}

export interface UserActivityTimeline {
  user_id: number;
  user_name: string;
  user_email: string;
  activities: AuditActivity[];
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  total_transactions: number;
  total_volume: number;
  suspicious_count: number;
}

export interface AuditActivity {
  id: number;
  timestamp: Date;
  activity_type: string;
  description: string;
  risk_score: number;
  related_transaction_id?: number;
  related_alert_id?: number;
  metadata?: any;
}

export interface RiskPattern {
  pattern_id: string;
  pattern_name: string;
  description: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  indicators: string[];
  threshold_values: { [key: string]: number };
  matches_count: number;
  last_detection: Date;
}

export interface SuspiciousActivityReport {
  id: number;
  transaction_ids: number[];
  user_id: number;
  pattern_matched: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  generated_at: Date;
  status: 'PENDING' | 'UNDER_REVIEW' | 'REPORTED' | 'DISMISSED';
  assigned_to?: number;
  reported_to_authorities?: boolean;
  report_reference?: string;
}

// Tipos para gráficos
export interface ChartOptions {
  series: any[];
  chart: any;
  xaxis: any;
  yaxis: any;
  colors: any[];
  labels: any[];
  title: any;
  subtitle: any;
  theme: any;
  plotOptions: any;
  tooltip: any;
  dataLabels: any;
  legend: any;
  stroke: any;
  fill: any;
  grid: any;
}

// Tipos para exportación
export interface ExportRequest {
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters: AuditFilters;
  includeCharts: boolean;
  includeTimeline: boolean;
  reportType: string;
}

export interface ExportResponse {
  download_url: string;
  file_name: string;
  expires_at: Date;
}
