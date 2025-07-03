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
  NgApexchartsModule,
  ApexDataLabels
} from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { User } from '../models/user.model';
import { AdminAnalyticsData } from '../models/admin-analytics.model';
import { StocksService } from '../services/stocks.service';
import { SharesService } from '../services/shares.service';
import { StockInitResponse } from '../models/stock.model';
import { CreateShareDto } from '../models/share.model';
import { MatIconModule } from '@angular/material/icon';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  theme: ApexTheme;
  tooltip?: ApexTooltip;
  dataLabels?: ApexDataLabels;
};

interface ShareCreationResult {
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, ChartComponent, FormsModule, MatIconModule],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.css']
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
 public chartOptions: Partial<ChartOptions> = {};
 private destroy$ = new Subject<void>();
 isDark = document.documentElement.classList.contains('dark');

 // Datos reales
 analyticsData: AdminAnalyticsData | null = null;

 // Datos reales
 qtyOrdersTotal = 0;
 qtyOrdersFill = 0;
 qtyOrdersInProcess = 0;
 qtyOrdersCanceled = 0;
 qtyOrderSell = 0;
 qtyOrderBuy = 0;
 qtyRechargesInAccounts = 0;
 totalRechargeApp = 0;
 totalCommissionApp = 0;
 totalAssetsInBriefcases = 0;
 qtySharesInOperation = 0;
 qtyAccountsStandard = 0;
 qtyAccountCommission = 0;
 
 private allUsers: User[] = []; // Para almacenar todos los usuarios cargados

  // Propiedades para la inicialización de mercados
  isInitializingMarkets = false;
  isInitialized = false;
  
  // Propiedades para la creación de acciones
  isCreatingShare = false;
  newShareSymbol: string = '';
  shareCreationResult: ShareCreationResult | null = null;

 constructor(
    private adminAnalyticsService: AdminAnalyticsService,
    private stocksService: StocksService,
    private sharesService: SharesService,
    private snackBar: MatSnackBar
    ) {}

  // Pie Chart - Distribución de órdenes (Compra vs Venta)
  orderDistribution = {
    series: [0, 0], // qty_order_buy, qty_order_sell
    chart: {
      type: 'donut',
      height: 500,
      width: 550,
      background: 'transparent',
    } as ApexChart,
    labels: ['Compra', 'Venta'],
    colors: ['#22c55e', '#ef4444'], // Verde para compra, Rojo para venta
    dataLabels: {
      enabled: true,
      style: {
        colors: [this.isDark ? '#FFFFFF' : '#333333']
      }
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " órdenes";
        }
      }
    }
  };

  // Bar Chart - Estado de Órdenes
  orderStatus = {
    series: [{ name: 'Cantidad', data: [0, 0, 0, 0] }], // qty_orders_total, qty_orders_fill, qty_orders_in_procces , qty_orders_cancelled
    chart: {
      type: 'bar',
      height: 350,
      background: 'transparent'
    } as ApexChart,
    xaxis: {
      categories: ['Total', 'Completadas', 'En Proceso', 'Canceladas'],
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
    colors: ['#3b82f6'], // Azul
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " órdenes";
        }
      }
    }
  };

  // Line Chart - Recargas y Comisiones
  rechargeCommissionChart = {
    series: [
      { name: 'Recargas', data: [] as number[] }, // total_recharge_app
      { name: 'Comisiones', data: [] as number[] }  // total_commission_app
    ],
    chart: {
      type: 'line',
      height: 300,
      background: 'transparent'
    } as ApexChart,
    xaxis: {
      categories: ['Datos Actuales'], // Solo un punto de datos para los totales
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
    colors: ['#10b981', '#f59e0b'], // Verde para recargas, Naranja para comisiones
    tooltip: {
      y: {
        formatter: function (val: number) {
          return '$' + val.toFixed(2);
        }
      }
    }
  };

  ngOnInit(): void {
   this.setupThemeObserver();
   this.loadAnalyticsData();
 }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAnalyticsData(): void {
   this.adminAnalyticsService.getAdminAnalytics().subscribe((data: AdminAnalyticsData) => {
     this.analyticsData = data;
     this.qtyOrdersTotal = data.qty_orders_total;
     this.qtyOrdersFill = data.qty_orders_fill;
     this.qtyOrdersInProcess = data.qty_orders_in_procces;
     this.qtyOrdersCanceled = data.qty_orders_canceled;
     this.qtyOrderSell = data.qty_order_sell;
     this.qtyOrderBuy = data.qty_order_buy;
     this.qtyRechargesInAccounts = data.qty_recharges_in_accounts;
     this.totalRechargeApp = data.total_recharge_app;
     this.totalCommissionApp = data.total_commission_app;
     this.totalAssetsInBriefcases = data.total_assets_in_briefcases;
     this.qtySharesInOperation = data.qty_shares_in_operation;
     this.qtyAccountsStandard = data.qty_accounts_standard;
     this.qtyAccountCommission = data.qty_account_commission;

     this.initializeCharts();
   });

   // Mantener la carga de usuarios para la distribución de roles si es necesario
   this.adminAnalyticsService.getUsersWithRoles().subscribe((users: User[]) => {
     this.allUsers = users;
     this.initializeCharts(); // Re-inicializar para actualizar la gráfica de roles
   });
 }

  private initializeCharts(): void {
    this.updateChartThemes();
  }

  private setupThemeObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.isDark = document.documentElement.classList.contains('dark');
          this.updateChartThemes(); // No pasar argumentos
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

   // Actualizar orderDistribution (anteriormente riskDistribution)
   this.orderDistribution = {
     ...this.orderDistribution,
     series: [this.qtyOrderBuy, this.qtyOrderSell],
     dataLabels: {
       ...this.orderDistribution.dataLabels,
       style: { colors: [labelColor] }
     },
     chart: {
       ...this.orderDistribution.chart,
       foreColor: labelColor, // Asegura que el texto del gráfico sea visible
       theme: { mode: themeMode }
     } as ApexChart
   };

   // Actualizar orderStatus (anteriormente transactionVolume)
   this.orderStatus = {
     ...this.orderStatus,
     series: [{
       name: 'Cantidad',
       data: [this.qtyOrdersTotal, this.qtyOrdersFill, this.qtyOrdersInProcess, this.qtyOrdersCanceled]
     }],
     xaxis: {
       ...this.orderStatus.xaxis,
       labels: { style: { colors: labelColor } }
     },
     yaxis: {
       ...this.orderStatus.yaxis,
       labels: { style: { colors: labelColor } }
     },
     chart: {
       ...this.orderStatus.chart,
       foreColor: labelColor,
       theme: { mode: themeMode }
     } as ApexChart
   };

   // Actualizar rechargeCommissionChart (anteriormente platformUsage)
   this.rechargeCommissionChart = {
     ...this.rechargeCommissionChart,
     series: [
       { name: 'Recargas', data: [this.totalRechargeApp] as number[] },
       { name: 'Comisiones', data: [this.totalCommissionApp] as number[] }
     ],
     xaxis: {
       ...this.rechargeCommissionChart.xaxis,
       labels: { style: { colors: labelColor } }
     },
     yaxis: {
       ...this.rechargeCommissionChart.yaxis,
       labels: { style: { colors: labelColor } }
     },
     chart: {
       ...this.rechargeCommissionChart.chart,
       foreColor: labelColor,
       theme: { mode: themeMode }
     } as ApexChart
   };
 }

  initializeMarkets(): void {
    this.isInitializingMarkets = true;
    this.shareCreationResult = null;
    
    this.stocksService.initializeMarkets().subscribe({
      next: (response: StockInitResponse) => {
        console.log('Mercados inicializados:', response);
        this.isInitialized = true;
        
        const marketCount = response.creado_o_actualizado?.length || 
                           (response.count ? response.count : 'varios');
        
        this.shareCreationResult = {
          success: true,
          message: `Se han inicializado correctamente ${marketCount} mercados.`
        };
        
        this.isInitializingMarkets = false;
        
        this.snackBar.open('Mercados inicializados correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: (err) => {
        console.error('Error al inicializar mercados:', err);
        this.shareCreationResult = {
          success: false,
          message: `Error al inicializar mercados: ${err.message || 'Error desconocido'}`
        };
        this.isInitializingMarkets = false;
        
        this.snackBar.open('Error al inicializar mercados', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  createShare(): void {
    if (!this.newShareSymbol) {
      this.shareCreationResult = {
        success: false,
        message: 'Por favor, ingrese un símbolo de acción.'
      };
      return;
    }
    
    this.isCreatingShare = true;
    this.shareCreationResult = null;
    
    const shareData: CreateShareDto = {
      symbol: this.newShareSymbol.toUpperCase()
    };
    
    this.sharesService.createShare(shareData).subscribe({
      next: (share) => {
        console.log('Acción creada:', share);
        this.shareCreationResult = {
          success: true,
          message: `Acción ${share.ticker} (${share.name_share}) creada exitosamente.`
        };
        this.newShareSymbol = '';
        this.isCreatingShare = false;
        
        this.snackBar.open(`Acción ${share.ticker} creada correctamente`, 'Cerrar', {
          duration: 3000
        });
      },
      error: (err) => {
        console.error('Error al crear acción:', err);
        this.shareCreationResult = {
          success: false,
          message: `Error al crear acción: ${err.message || 'Error desconocido'}.`
        };
        this.isCreatingShare = false;
        
        this.snackBar.open('Error al crear la acción', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
