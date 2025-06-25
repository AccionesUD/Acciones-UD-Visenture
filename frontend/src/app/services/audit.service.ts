import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  AuditTransaction, 
  AuditAlert, 
  AuditFilters, 
  AuditStats, 
  ComplianceReport, 
  ComplianceTemplate,
  UserActivityTimeline,
  RiskPattern,
  SuspiciousActivityReport,
  ExportRequest,
  ExportResponse
} from '../models/audit.model';
import { environment } from '../../environments/environment';

export interface AuditResponse {
  transactions: AuditTransaction[];
  alerts: AuditAlert[];
  stats: AuditStats;
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly apiUrl = `${environment.apiUrl}/audit`;
  
  // Subjects para datos reactivos
  private transactionsSubject = new BehaviorSubject<AuditTransaction[]>([]);
  private alertsSubject = new BehaviorSubject<AuditAlert[]>([]);
  private statsSubject = new BehaviorSubject<AuditStats | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public transactions$ = this.transactionsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Métodos principales de auditoría
  getAuditData(filters: AuditFilters, page: number = 1, limit: number = 50): Observable<AuditResponse> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Añadir filtros a los parámetros
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo.toISOString());
    }
    if (filters.userId) {
      params = params.set('userId', filters.userId.toString());
    }
    if (filters.accountId) {
      params = params.set('accountId', filters.accountId.toString());
    }
    if (filters.transactionType) {
      params = params.set('transactionType', filters.transactionType);
    }
    if (filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.riskScoreMin !== undefined) {
      params = params.set('riskScoreMin', filters.riskScoreMin.toString());
    }
    if (filters.riskScoreMax !== undefined) {
      params = params.set('riskScoreMax', filters.riskScoreMax.toString());
    }
    if (filters.suspiciousOnly) {
      params = params.set('suspiciousOnly', filters.suspiciousOnly.toString());
    }
    if (filters.reviewedOnly) {
      params = params.set('reviewedOnly', filters.reviewedOnly.toString());
    }
    if (filters.searchText) {
      params = params.set('searchText', filters.searchText);
    }

    return this.http.get<AuditResponse>(`${this.apiUrl}/data`, { params }).pipe(
      tap(response => {
        this.transactionsSubject.next(response.transactions);
        this.alertsSubject.next(response.alerts);
        this.statsSubject.next(response.stats);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Gestión de alertas
  getAlerts(filters?: Partial<AuditFilters>): Observable<AuditAlert[]> {
    let params = new HttpParams();
    
    if (filters?.alertType) {
      params = params.set('alertType', filters.alertType);
    }
    if (filters?.alertSeverity) {
      params = params.set('severity', filters.alertSeverity);
    }
    if (filters?.alertStatus) {
      params = params.set('status', filters.alertStatus);
    }

    return this.http.get<AuditAlert[]>(`${this.apiUrl}/alerts`, { params });
  }

  updateAlert(alertId: number, updates: Partial<AuditAlert>): Observable<AuditAlert> {
    return this.http.patch<AuditAlert>(`${this.apiUrl}/alerts/${alertId}`, updates);
  }

  assignAlert(alertId: number, assignedTo: number): Observable<AuditAlert> {
    return this.http.patch<AuditAlert>(`${this.apiUrl}/alerts/${alertId}/assign`, { assigned_to: assignedTo });
  }

  resolveAlert(alertId: number, resolution: string): Observable<AuditAlert> {
    return this.http.patch<AuditAlert>(`${this.apiUrl}/alerts/${alertId}/resolve`, { 
      status: 'RESOLVED',
      resolution_notes: resolution,
      resolved_at: new Date()
    });
  }

  // Timeline de actividad de usuario
  getUserTimeline(userId: number, dateFrom?: Date, dateTo?: Date): Observable<UserActivityTimeline> {
    let params = new HttpParams();
    
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom.toISOString());
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo.toISOString());
    }

    return this.http.get<UserActivityTimeline>(`${this.apiUrl}/users/${userId}/timeline`, { params });
  }

  // Patrones de riesgo
  getRiskPatterns(): Observable<RiskPattern[]> {
    return this.http.get<RiskPattern[]>(`${this.apiUrl}/risk-patterns`);
  }

  detectSuspiciousPatterns(filters: AuditFilters): Observable<SuspiciousActivityReport[]> {
    return this.http.post<SuspiciousActivityReport[]>(`${this.apiUrl}/detect-patterns`, filters);
  }

  // Reportes de cumplimiento
  getComplianceReports(page: number = 1, limit: number = 20): Observable<{ reports: ComplianceReport[], total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ reports: ComplianceReport[], total: number }>(`${this.apiUrl}/compliance-reports`, { params });
  }

  generateComplianceReport(
    templateId: number, 
    periodStart: Date, 
    periodEnd: Date, 
    format: string = 'PDF',
    includeCharts: boolean = true,
    includeTimeline: boolean = false
  ): Observable<ComplianceReport> {
    // En un entorno real esto haría una llamada HTTP
    // return this.http.post<ComplianceReport>(`${this.apiUrl}/compliance-reports`, {
    //   templateId,
    //   periodStart,
    //   periodEnd,
    //   format,
    //   includeCharts,
    //   includeTimeline
    // });
    
    // Para desarrollo, simular una respuesta
    return new Observable(observer => {
      this.loadingSubject.next(true);
      
      setTimeout(() => {
        const report: ComplianceReport = {
          id: Math.floor(Math.random() * 10000),
          report_type: 'COMPLIANCE',
          generated_at: new Date(),
          generated_by: 1,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'COMPLETED',
          template_id: templateId,
          file_path: format === 'PDF' 
            ? 'assets/mocks/sample_report.pdf' 
            : (format === 'EXCEL' ? 'assets/mocks/sample_report.xlsx' : 'assets/mocks/sample_report.csv')
        };
        
        this.loadingSubject.next(false);
        observer.next(report);
        observer.complete();
      }, 2000);
    });
  }
  
  getComplianceTemplates(): Observable<ComplianceTemplate[]> {
    // En un entorno real esto haría una llamada HTTP
    // return this.http.get<ComplianceTemplate[]>(`${this.apiUrl}/compliance-templates`);
    
    // Para desarrollo, simular una respuesta
    return new Observable(observer => {
      const templates: ComplianceTemplate[] = [
        { id: 1, name: 'Reporte Mensual Estándar', description: 'Reporte de cumplimiento normativo mensual', template_type: 'MONTHLY', regulations: ['GDPR', 'PCI-DSS'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Auditoría de Alto Riesgo', description: 'Reporte específico para transacciones de alto riesgo', template_type: 'HIGH_RISK', regulations: ['AML'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Reporte Trimestral', description: 'Análisis trimestral de cumplimiento normativo', template_type: 'QUARTERLY', regulations: ['SOX', 'GDPR'], fields: [], created_at: new Date(), updated_at: new Date() }
      ];
      
      observer.next(templates);
      observer.complete();
    });
  }

  // Exportación de datos
  exportAuditData(exportRequest: ExportRequest): Observable<ExportResponse> {
    return this.http.post<ExportResponse>(`${this.apiUrl}/export`, exportRequest);
  }

  downloadReport(reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/compliance-reports/${reportId}/download`, { 
      responseType: 'blob' 
    });
  }

  // Estadísticas y métricas
  getAuditStats(filters?: Partial<AuditFilters>): Observable<AuditStats> {
    let params = new HttpParams();
    
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo.toISOString());
    }

    return this.http.get<AuditStats>(`${this.apiUrl}/stats`, { params });
  }

  // Datos para gráficos
  getTransactionTrends(period: string = '30d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get(`${this.apiUrl}/charts/transaction-trends`, { params });
  }

  getRiskDistribution(): Observable<any> {
    return this.http.get(`${this.apiUrl}/charts/risk-distribution`);
  }

  getAlertsTrends(period: string = '30d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get(`${this.apiUrl}/charts/alerts-trends`, { params });
  }

  // Marcar transacciones como revisadas
  markTransactionAsReviewed(transactionId: number, notes?: string): Observable<AuditTransaction> {
    return this.http.patch<AuditTransaction>(`${this.apiUrl}/transactions/${transactionId}/review`, {
      reviewed: true,
      reviewed_at: new Date(),
      notes: notes
    });
  }

  // Flaggear transacciones como sospechosas
  flagTransactionAsSuspicious(transactionId: number, reason: string): Observable<AuditTransaction> {
    return this.http.patch<AuditTransaction>(`${this.apiUrl}/transactions/${transactionId}/flag`, {
      is_suspicious: true,
      flagged_reason: reason
    });
  }

  // Búsqueda avanzada
  searchTransactions(query: string, filters?: Partial<AuditFilters>): Observable<AuditTransaction[]> {
    let params = new HttpParams().set('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<AuditTransaction[]>(`${this.apiUrl}/search`, { params });
  }

  // Simulación de datos para desarrollo (temporal)
  getMockAuditData(): Observable<AuditResponse> {
    const mockResponse: AuditResponse = {
      transactions: this.generateMockTransactions(),
      alerts: this.generateMockAlerts(),
      stats: this.generateMockStats(),
      total: 150,
      page: 1,
      totalPages: 3
    };

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockResponse);
        observer.complete();
      }, 1000);
    });
  }

  private generateMockTransactions(): AuditTransaction[] {
    const transactions: AuditTransaction[] = [];
    const types = ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL'];
    const statuses = ['COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'];
    
    for (let i = 1; i <= 50; i++) {
      transactions.push({
        id: i,
        id_account: Math.floor(Math.random() * 100) + 1,
        value_transaction: Math.random() * 100000,
        date_transaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        type_transaction: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        risk_score: Math.random() * 100,
        is_suspicious: Math.random() > 0.9,
        reviewed: Math.random() > 0.7,
        user_name: `Usuario ${i}`,
        user_email: `user${i}@example.com`,
        account_type: 'STANDARD'
      });
    }
    
    return transactions;
  }

  private generateMockAlerts(): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    const types = ['HIGH_VOLUME', 'UNUSUAL_PATTERN', 'VELOCITY_CHECK', 'GEOGRAPHIC_ANOMALY'];
    const severities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statuses: ('OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE')[] = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
    
    for (let i = 1; i <= 20; i++) {
      alerts.push({
        id: i,
        transaction_id: Math.floor(Math.random() * 50) + 1,
        user_id: Math.floor(Math.random() * 100) + 1,
        alert_type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `Alerta de tipo ${types[Math.floor(Math.random() * types.length)]} detectada`,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
    
    return alerts;
  }

  private generateMockStats(): AuditStats {
    return {
      totalTransactions: 1250,
      suspiciousTransactions: 45,
      totalAlerts: 156,
      openAlerts: 23,
      highRiskTransactions: 78,
      averageRiskScore: 32.5,
      totalVolume: 15680000,
      uniqueUsers: 342
    };
  }
}
