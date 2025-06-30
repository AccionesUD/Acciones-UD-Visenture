import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  ApexAxisChartSeries, 
  ApexChart, 
  ApexXAxis, 
  ApexTitleSubtitle,
  ApexYAxis,
  ApexTheme,
  ApexTooltip, 
  ChartComponent,
  NgApexchartsModule 
} from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  theme: ApexTheme;
  tooltip?: ApexTooltip;
};

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, ChartComponent],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.css']
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  public chartOptions: Partial<ChartOptions> = {};
  private destroy$ = new Subject<void>();
  isDark = document.documentElement.classList.contains('dark');
  
  // Datos de ejemplo
  usuariosTotales = 1500;
  NuevosUsuarios = 200;
  Activos = 800;
  sucripcionesPremium = 300;
  ingresosPorComisiones = '$23,640,000 COP';

  // Pie Chart - Distribución de riesgo
  riskDistribution = {
    series: [35, 45, 20],
    chart: {
      type: 'donut',
      height: 500,
      width: 550,
      background: 'transparent',
    } as ApexChart,
    labels: ['Conservador', 'Moderado', 'Agresivo'],
    colors: ['#10b981', '#3b82f6', '#ef4444'],
    dataLabels: {
      enabled: true,
      style: {
        colors: [this.isDark ? '#FFFFFF' : '#333333']
      }
    },
  };

  // Bar Chart - Transacciones por mercado
  transactionVolume = {
    series: [{ name: 'Volumen', data: [1200, 900, 400, 700] }],
    chart: { 
      type: 'bar', 
      height: 350,
      background: 'transparent'
    } as ApexChart,
    xaxis: { 
      categories: ['BVC', 'NASDAQ', 'NYSE', 'CSE'],
      labels: {
        style: {
          colors: this.isDark ? '#FFFFFF' : '#333333'
        }
      }
    } as ApexXAxis,
    yaxis: {
      labels: {
        style: {
          colors: this.isDark ? '#FFFFFF' : '#333333'
        }
      }
    } as ApexYAxis,
    colors: ['#22c55e']
  };

  // Line Chart - Uso de plataforma
  platformUsage = {
    series: [{ name: 'Sesiones', data: [120, 130, 140, 180, 160, 190, 220] }],
    chart: { 
      type: 'line', 
      height: 300,
      background: 'transparent'
    } as ApexChart,
    xaxis: { 
      categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      labels: {
        style: {
          colors: this.isDark ? '#FFFFFF' : '#333333'
        }
      }
    } as ApexXAxis,
    yaxis: {
      labels: {
        style: {
          colors: this.isDark ? '#FFFFFF' : '#333333'
        }
      }
    } as ApexYAxis,
  };

  ngOnInit(): void {
    this.setupThemeObserver();
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCharts(): void {
    this.updateChartThemes();
  }

  private setupThemeObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.isDark = document.documentElement.classList.contains('dark');
          this.updateChartThemes();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    this.destroy$.subscribe(() => observer.disconnect());
  }

  private updateChartThemes(): void {
    const labelColor = this.isDark ? '#FFFFFF' : '#333333';
    const themeMode = this.isDark ? 'dark' : 'light';

    // Actualizar riskDistribution
    this.riskDistribution = {
      ...this.riskDistribution,
      dataLabels: {
        ...this.riskDistribution.dataLabels,
        style: { colors: [labelColor] }
      }
    };

    // Actualizar transactionVolume
    this.transactionVolume = {
      ...this.transactionVolume,
      xaxis: {
        ...this.transactionVolume.xaxis,
        labels: { style: { colors: labelColor } }
      },
      yaxis: {
        ...this.transactionVolume.yaxis,
        labels: { style: { colors: labelColor } }
      }
    };

    // Actualizar platformUsage
    this.platformUsage = {
      ...this.platformUsage,
      xaxis: {
        ...this.platformUsage.xaxis,
        labels: { style: { colors: labelColor } }
      },
      yaxis: {
        ...this.platformUsage.yaxis,
        labels: { style: { colors: labelColor } }
      }
    };
  }
}