import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuditService } from '../../services/audit.service';
import { ComplianceTemplate } from '../../models/audit.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Componente para generar informes de cumplimiento normativo
 * Este componente permite a los usuarios seleccionar una plantilla
 * y definir un período para generar informes de cumplimiento.
 */
@Component({
  selector: 'app-compliance-report-dialog',
  templateUrl: './compliance-report-dialog.component.html',
  styleUrls: ['./compliance-report-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatCheckboxModule
  ]
})
export class ComplianceReportDialogComponent implements OnInit {
  reportForm: FormGroup;
  templates: ComplianceTemplate[] = [];
  loading = false;
  private destroy$ = new Subject<void>();
  regulations: { [key: string]: string } = {
    'GDPR': 'Protección de Datos',
    'PCI-DSS': 'Seguridad de Datos de Tarjetas',
    'AML': 'Anti Lavado de Dinero',
    'SOX': 'Sarbanes-Oxley',
    'KYC': 'Conoce a tu Cliente',
    'MiFID': 'Mercados de Instrumentos Financieros'
  };

  constructor(
    public dialogRef: MatDialogRef<ComplianceReportDialogComponent>,
    private fb: FormBuilder,
    private auditService: AuditService
  ) {
    // Configuración para el diálogo
    this.dialogRef.disableClose = false;
    this.dialogRef.addPanelClass('compliance-report-dialog');
    
    // Inicializar el formulario con fechas por defecto: último mes
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.reportForm = this.fb.group({
      templateId: [null, Validators.required],
      periodStart: [lastMonth, Validators.required],
      periodEnd: [today, Validators.required],
      includeCharts: [true],
      includeTimeline: [false],
      format: ['PDF']
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.loading = true;
    
    // Para desarrollo, usamos plantillas simuladas
    setTimeout(() => {
      this.templates = [
        { id: 1, name: 'Reporte Mensual Estándar', description: 'Reporte de cumplimiento normativo mensual', template_type: 'MONTHLY', regulations: ['GDPR', 'PCI-DSS'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Auditoría de Alto Riesgo', description: 'Reporte específico para transacciones de alto riesgo', template_type: 'HIGH_RISK', regulations: ['AML'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Reporte Trimestral', description: 'Análisis trimestral de cumplimiento normativo', template_type: 'QUARTERLY', regulations: ['SOX', 'GDPR'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 4, name: 'Reporte KYC', description: 'Verificación de identidad y cumplimiento KYC', template_type: 'KYC', regulations: ['KYC', 'AML'], fields: [], created_at: new Date(), updated_at: new Date() },
        { id: 5, name: 'Informe MiFID', description: 'Evaluación de cumplimiento de las directivas MiFID', template_type: 'MIFID', regulations: ['MiFID'], fields: [], created_at: new Date(), updated_at: new Date() }
      ];
      this.loading = false;
    }, 500);

    // Implementación real comentada
    /*
    this.auditService.getComplianceTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.templates = templates;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    */
  }

  /**
   * Obtiene el nombre localizado de una regulación
   */
  getRegulationName(code: string): string {
    return this.regulations[code] || code;
  }
  
  /**
   * Obtiene la plantilla seleccionada
   */
  getSelectedTemplate(): ComplianceTemplate | undefined {
    const templateId = this.reportForm.get('templateId')?.value;
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * Formatea una fecha para mostrarla en la interfaz
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Envía el formulario para generar el informe
   */
  onSubmit(): void {
    if (this.reportForm.valid) {
      this.loading = true;
      // Simulamos un breve procesamiento
      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close(this.reportForm.value);
      }, 800);
    }
  }

  /**
   * Cierra el diálogo sin realizar acciones
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
