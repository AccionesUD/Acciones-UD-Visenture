import { Component } from '@angular/core';
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
  imports: [ NgApexchartsModule, CommonModule, ChartComponent ],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css'
})
export class AdminAnalyticsComponent {
today = new Date();

  // Pie Chart - Distribución de riesgo
  riskDistribution = {
    series: [35, 45, 20],
    chart: { type: 'donut',height: 500,
    width: 550, } as ApexChart,
    labels: ['Conservador', 'Moderado', 'Agresivo'],
    colors: ['#10b981', '#3b82f6', '#ef4444'],
    dataLabels: {
    enabled: true,
    style: {
      colors: ['#fff']
      }
    },
    theme: {
    mode: 'dark'
    }
  };

  // Bar Chart - Transacciones por mercado
  transactionVolume = {
    series: [{ name: 'Volumen', data: [1200, 900, 400, 700] }],
    chart: { type: 'bar', height: 350 } as ApexChart,
    xaxis: { categories: ['BVC', 'NASDAQ', 'NYSE', 'CSE'] } as ApexXAxis,
    colors: ['#22c55e']
  };

  // Line Chart - Uso de plataforma
  platformUsage = {
    series: [{ name: 'Sesiones', data: [120, 130, 140, 180, 160, 190, 220] }],
    chart: { type: 'line', height: 300 } as ApexChart,
    xaxis: { categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] } as ApexXAxis
  };
}
