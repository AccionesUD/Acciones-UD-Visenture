import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { MockChartDataService } from '../services/mock-data-chart.service';
import { AlpacaDataService } from '../services/alpaca-data.service';
import { SharesService } from '../services/shares.service';
import { StocksService } from '../services/stocks.service';
import { Stock } from '../models/stock.model';
import { Share } from '../models/share.model';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

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
  selector: 'app-dashboard',
  standalone: true,  imports: [
    CommonModule, 
    FormsModule,
    ChartComponent,
    NgApexchartsModule,
    MatProgressSpinnerModule, 
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  providers: [MockChartDataService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {

  public chartOptions: Partial<ChartOptions>={};
  public isLoading = true;
  public isLoadingWatchlist = true;
  public isLoadingTransactions = true;
  public useMockData = false;
  public currentSymbol = 'AAPL';
  public transactions: any[] = [];
  private destroy$ = new Subject<void>();

  public watchlistShares: any[] = [];
  public availableStocks: Stock[] = []; // Mercados disponibles
  public availableShares: Share[] = []; // Acciones disponibles

  // Opciones de timeframe y periodo para el usuario
  public availableTimeframes = [
    { value: '1Min', label: '1 min' },
    { value: '5Min', label: '5 min' },
    { value: '15Min', label: '15 min' },
    { value: '1H', label: '1 hora' },
    { value: '1D', label: '1 día' }
  ];
  
  public availablePeriods = [
    { value: 1, label: 'Último día' },
    { value: 7, label: 'Última semana' },
    { value: 30, label: 'Último mes' },
    { value: 90, label: 'Último trimestre' },
    { value: 365, label: 'Último año' }
  ];
  
  public selectedTimeframe = '1H';
  public selectedPeriod = 30;
  constructor(
    private http: HttpClient,
    private mockService: MockChartDataService,
    private alpacaService: AlpacaDataService,
    private sharesService: SharesService,
    private stocksService: StocksService
  ) {
    this.initializeChart();
    // Cargamos datos iniciales del símbolo por defecto (AAPL)
    setTimeout(() => this.preloadDefaultData(), 0);
  }  ngOnInit(): void {
    this.loadData();
    
    // Actualizamos el gráfico cada 2 minutos (120000 ms)
    interval(120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Actualizando gráfico automáticamente...');
        this.loadChartData(this.currentSymbol);
      });
    
    // Actualizamos la lista de observación cada 60 segundos (60000 ms) para optimizar consumo de API
    // Aumentamos el intervalo para reducir la carga en la API
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Solo actualizamos si no estamos usando datos simulados
        if (!this.useMockData) {
          console.log('Actualizando lista de observación automáticamente...');
          this.loadWatchlistShares();
        }
      });
      
    // Configuramos el observador para detectar cambios en las clases del documento
    // Esto nos permite detectar cambios entre modo claro/oscuro
    this.setupThemeObserver();
  }
    /**
   * Configura un observador para detectar cambios en la clase 'dark' del elemento root
   * y actualiza los temas de la gráfica cuando cambian
   */  setupThemeObserver(): void {
    let themeChangeTimeout: any = null;
    let lastThemeMode: string | null = null;
    
    // Creamos un MutationObserver para detectar cambios en la clase de documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          console.log('¡Detectado cambio de tema!');
          
          // Limpiamos cualquier timeout pendiente para evitar múltiples actualizaciones
          if (themeChangeTimeout) {
            clearTimeout(themeChangeTimeout);
          }
          
          // Esperamos un breve momento para asegurarnos de que todos los cambios de clase se completen
          themeChangeTimeout = setTimeout(() => {
            // Verificamos si el tema realmente ha cambiado
            const isDark = document.documentElement.classList.contains('dark');
            const currentThemeMode = isDark ? 'dark' : 'light';
            
            if (currentThemeMode !== lastThemeMode) {
              console.log(`Tema cambiado de ${lastThemeMode || 'inicial'} a ${currentThemeMode}`);
              lastThemeMode = currentThemeMode;
              
              // Comprobamos si hay datos en la gráfica antes de actualizarla
              const hasData = (this.chartOptions?.series?.[0]?.data?.length ?? 0) > 0;
              
              if (hasData) {
                console.log('Aplicando nuevo tema a la gráfica');
                this.updateChartTheme();
                
                // Recargamos los datos para refrescar correctamente la gráfica con el nuevo tema
                if (!this.isLoading) {
                  console.log('Recargando datos para refrescar la gráfica con el nuevo tema');
                  this.loadChartData(this.currentSymbol, true);
                }
              } else {
                console.log('La gráfica no tiene datos aún, se aplicará el tema cuando se carguen');
              }
            } else {
              console.log('El tema no ha cambiado realmente, evitando actualización');
            }
            
            themeChangeTimeout = null;
          }, 300); // Aumentamos el retraso para asegurar que todos los cambios CSS se han aplicado
        }
      });
    });
    
    // Observamos cambios en el atributo class del documentElement
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Guardamos el observador para limpiarlo después
    this.destroy$.subscribe(() => {
      if (themeChangeTimeout) {
        clearTimeout(themeChangeTimeout);
      }
      observer.disconnect();
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    this.isLoading = true;
    this.isLoadingWatchlist = true;
    this.isLoadingTransactions = true;
    
    // Primero inicializamos los mercados y luego cargamos los datos
    this.stocksService.getStocks().subscribe({
      next: (stocks) => {
        this.availableStocks = stocks;
        console.log('Mercados cargados en dashboard:', stocks.length);
        
        // Una vez que los mercados están cargados, podemos cargar las acciones
        if (stocks.length > 0) {
          this.loadWatchlistShares();
        }
      },
      error: (err) => {
        console.error('Error al cargar mercados en dashboard:', err);
        // Intentamos cargar watchlist de todas formas
        this.loadWatchlistShares();
      }
    });
    
    // Ya no llamamos a loadChartData aquí porque lo hicimos en preloadDefaultData
    // para mostrar el gráfico tan pronto como sea posible
    
    // Cargar transacciones recientes
    this.loadTransactions();
  }
    refreshData(): void {
    console.log('Actualizando datos del dashboard...');
    
    // Actualizar solo datos dinámicos
    this.loadChartData(this.currentSymbol);
    
    // Solo actualizamos la watchlist si no estamos usando datos simulados
    if (!this.useMockData) {
      this.loadWatchlistShares();
    } else {
      // Si estamos en modo simulado, recargamos datos simulados sin llamada API
      this.loadFallbackWatchlist();
    }
  }loadWatchlistShares(): void {
    this.isLoadingWatchlist = true;
    
    // Lista fija de símbolos populares para el watchlist
    // Esta lista es fija para evitar cargas innecesarias y problemas de rendimiento
    const fixedSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
    
    // Si tenemos acciones disponibles del backend, las usamos preferentemente
    if (this.availableShares && this.availableShares.length > 0) {
      console.log('Usando acciones del backend para watchlist');
      
      // Limitamos a máximo 10 acciones para no sobrecargar la API
      const limitedShares = this.availableShares.slice(0, 10);
      
      // Mapeamos las acciones al formato esperado
      const sharesData = limitedShares.map(share => ({
        ticker: share.ticker,
        name_share: share.name_share
      }));
      
      this.getWatchlistPrices(sharesData);
    } 
    // Si no tenemos acciones pero tenemos mercados, usamos símbolos fijos con nombres locales
    else {
      console.log('Usando símbolos fijos para watchlist');
      
      // Usamos directamente los nombres estáticos (evitamos llamada API)
      const sharesData = fixedSymbols.map(ticker => ({
        ticker: ticker,
        name_share: this.getCompanyName(ticker)
      }));
      
      this.getWatchlistPrices(sharesData);
    }
  }
    /**
   * Obtiene precios reales para las acciones de la lista de observación
   * @param shares Lista de acciones con ticker y name_share
   */
  getWatchlistPrices(shares: any[]): void {
    if (!shares || shares.length === 0) {
      console.warn('No hay acciones para mostrar en watchlist, usando datos de respaldo');
      this.loadFallbackWatchlist();
      return;
    }
    
    // Obtenemos los símbolos de las acciones
    const symbols = shares.map(share => share.ticker);
    console.log('Obteniendo cotizaciones para watchlist:', symbols);
    
    // Creamos un mapa de símbolos a nombres para mantener los nombres correctos
    const symbolToNameMap = new Map<string, string>();
    shares.forEach(share => {
      symbolToNameMap.set(share.ticker, share.name_share || this.getCompanyName(share.ticker));
    });
      // Si estamos en modo de datos simulados, usamos directamente los datos de respaldo
    if (this.useMockData) {
      console.log('Usando datos simulados para watchlist');
      this.loadFallbackWatchlist();
      return;
    }
    
    // Limitamos el número de símbolos para no sobrecargar la API
    const limitedSymbols = symbols.slice(0, 10); // Máximo 10 símbolos
    console.log('Símbolos limitados para watchlist:', limitedSymbols);
    
    // Usamos el método que obtiene snapshots para múltiples símbolos en una sola llamada
    this.alpacaService.getMultipleLatestQuotes(limitedSymbols)
      .subscribe({
        next: (snapshots) => {
          console.log('Cotizaciones obtenidas para watchlist:', snapshots);
          
          // Verificamos si recibimos datos válidos
          if (!snapshots || Object.keys(snapshots).length === 0) {
            console.warn('No se recibieron datos de snapshots, usando datos de respaldo');
            this.loadFallbackWatchlist();
            return;
          }
          
          const watchlistData: any[] = [];
          
          // Procesamos cada símbolo
          symbols.forEach(symbol => {
            const companyName = symbolToNameMap.get(symbol) || this.getCompanyName(symbol);
            
            // Verificamos si tenemos datos para este símbolo
            if (snapshots && snapshots[symbol]) {
              const snapshot = snapshots[symbol];
              const latestBar = snapshot.latestBar || snapshot.dailyBar;
              const latestQuote = snapshot.latestQuote;
              const latestTrade = snapshot.latestTrade;
              
              let currentPrice = 0;
              let change = 0;
              let changePercent = 0;
              let isPositive = false;
              
              // Determinamos el precio más reciente disponible
              if (latestTrade && latestTrade.p) {
                // Precio del último trade
                currentPrice = latestTrade.p;
              } else if (latestQuote && (latestQuote.ap || latestQuote.bp)) {
                // Promedio de ask/bid si no hay trade
                currentPrice = latestQuote.ap 
                  ? (latestQuote.bp ? (latestQuote.ap + latestQuote.bp) / 2 : latestQuote.ap) 
                  : latestQuote.bp;
              } else if (latestBar && latestBar.c) {
                // Precio de cierre de la última barra
                currentPrice = latestBar.c;
              }
              
              // Calculamos el cambio porcentual si tenemos una referencia previa
              if (latestBar && latestBar.c && latestBar.o) {
                // Calculamos desde apertura a cierre en la barra
                change = latestBar.c - latestBar.o;
                changePercent = (change / latestBar.o) * 100;
                isPositive = change >= 0;
              } else if (snapshot.prevDailyBar && latestBar && latestBar.c) {
                // Calculamos desde cierre previo a cierre actual
                change = latestBar.c - snapshot.prevDailyBar.c;
                changePercent = (change / snapshot.prevDailyBar.c) * 100;
                isPositive = change >= 0;
              } else {
                // Si no tenemos referencia, asumimos un cambio aleatorio
                changePercent = (Math.random() * 10 - 5);
                isPositive = changePercent >= 0;
              }
              
              // Aseguramos que el precio es un valor válido
              if (currentPrice <= 0 || isNaN(currentPrice)) {
                console.warn(`Precio inválido para ${symbol}, usando valor por defecto`);
                currentPrice = 100 + Math.random() * 900; // Valor entre 100 y 1000
              }
              
              watchlistData.push({
                symbol: symbol,
                name: companyName,
                price: currentPrice,
                change: changePercent.toFixed(2),
                isPositive: isPositive
              });
            } else {
              console.warn(`No hay datos para el símbolo ${symbol}, usando datos simulados`);
              // Si no tenemos datos para este símbolo, usamos un precio simulado
              watchlistData.push({
                symbol: symbol,
                name: companyName,
                price: Math.random() * 1000 + 50,
                change: (Math.random() * 10 - 5).toFixed(2),
                isPositive: Math.random() > 0.5
              });
            }
          });
          
          // Ordenamos los datos primero por cambio porcentual (descendente) y luego por símbolo
          watchlistData.sort((a, b) => {
            // Primero ordenamos por mayor cambio positivo
            const aChange = parseFloat(a.change);
            const bChange = parseFloat(b.change);
            
            if (a.isPositive && !b.isPositive) return -1;
            if (!a.isPositive && b.isPositive) return 1;
            if (a.isPositive && b.isPositive) {
              if (aChange !== bChange) return bChange - aChange; // Mayor % arriba
            }
            if (!a.isPositive && !b.isPositive) {
              if (aChange !== bChange) return aChange - bChange; // Menor % negativo arriba
            }
            // Si tienen el mismo signo y valor, ordenar por símbolo
            return a.symbol.localeCompare(b.symbol);
          });
          
          this.watchlistShares = watchlistData;
          this.isLoadingWatchlist = false;
        },
        error: (err) => {
          console.error('Error al obtener cotizaciones para watchlist:', err);
          
          // En caso de error, fallback a datos simulados usando la función existente
          this.loadFallbackWatchlist();
        },
        complete: () => {
          // Aseguramos que se marca como cargado incluso si hay algún problema
          this.isLoadingWatchlist = false;
        }
      });
  }
  
  /**
   * Carga datos de watchlist predefinidos en caso de error
   */
  loadFallbackWatchlist(): void {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    this.watchlistShares = popularSymbols.map(symbol => ({
      symbol,
      name: this.getCompanyName(symbol),
      price: Math.random() * 1000 + 50, // Precio aleatorio entre 50 y 1050
      change: (Math.random() * 10 - 5).toFixed(2), // Cambio entre -5% y +5%
      isPositive: Math.random() > 0.5 // 50% positivo, 50% negativo
    }));
    
    this.isLoadingWatchlist = false;
  }
    loadChartData(symbol: string, skipLoading: boolean = false): void {
    if (!skipLoading) {
      this.isLoading = true;
    }
    this.currentSymbol = symbol;
    
    console.log(`Cargando datos para ${symbol} con periodo ${this.selectedPeriod} días y timeframe ${this.selectedTimeframe}`);
    
    if (this.useMockData) {
      // Usar datos simulados
      const mockData = this.mockService.getMockData(symbol);
      this.updateChartWithData(mockData, symbol);
    } else {
      // Usar datos reales de Alpaca con el nuevo método para más datos
      this.alpacaService.getExtendedHistoricalData(
        symbol,                 // Símbolo
        this.selectedPeriod,    // Período seleccionado
        this.selectedTimeframe, // Timeframe seleccionado
        {                       // Parámetros adicionales
          feed: 'iex' 
        }
      ).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.updateChartWithData(data, symbol);
          } else {
            console.warn(`No hay datos disponibles para ${symbol}, usando datos simulados`);
            const mockData = this.mockService.getMockData(symbol);
            this.updateChartWithData(mockData, symbol);
          }
        },
        error: (error) => {
          console.error(`Error al obtener datos para ${symbol}:`, error);
          // En caso de error, usamos datos simulados
          const mockData = this.mockService.getMockData(symbol);
          this.updateChartWithData(mockData, symbol);
        }
      });
    }
  }
  
  // Este método se utiliza para cambiar el símbolo de la acción en el gráfico
  changeSymbol(symbol: string): void {
    if (symbol !== this.currentSymbol) {
      console.log(`Cambiando símbolo a: ${symbol}`);
      this.loadChartData(symbol);
    }
  }
    /**
   * Actualiza el tema de la gráfica basado en el tema actual de la página
   * Este método puede llamarse cuando se detecta un cambio de tema
   */  updateChartTheme(): void {
    const isDark = document.documentElement.classList.contains('dark');
    console.log(`Actualizando tema de la gráfica a: ${isDark ? 'oscuro' : 'claro'}`);
    
    if (this.chartOptions && this.chartOptions.theme) {
      this.chartOptions.theme.mode = isDark ? 'dark' : 'light';
      
      // Actualizar colores basados en el tema
      if (this.chartOptions.title) {
        this.chartOptions.title.style = { color: isDark ? '#FFFFFF' : '#333333' };
      }
      
      if (this.chartOptions.xaxis) {
        this.chartOptions.xaxis.labels = { style: { colors: isDark ? '#FFFFFF' : '#333333' } };
        this.chartOptions.xaxis.axisBorder = { show: true, color: isDark ? '#FFFFFF' : '#333333' };
        this.chartOptions.xaxis.axisTicks = { show: true, color: isDark ? '#FFFFFF' : '#333333' };
      }
      
      if (this.chartOptions.yaxis) {
        this.chartOptions.yaxis.labels = { style: { colors: isDark ? '#FFFFFF' : '#333333' } };
      }
      
      if (this.chartOptions.tooltip) {
        this.chartOptions.tooltip.theme = isDark ? 'dark' : 'light';
      }
      
      // Simplemente actualizamos las opciones sin recargar datos
      // Esto evita el bucle infinito que se produce cuando updateChartWithData llama a updateChartTheme
      console.log('Aplicando nuevo tema a la gráfica sin recargar datos');
      this.chartOptions = {...this.chartOptions};
    }
  }
  
  updateChartWithData(data: any[], symbol: string): void {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Transformar los datos al formato que espera ApexCharts
    // Si son StockBar, convertirlos a formato correcto para la gráfica
    const seriesData = data.map(item => {
      if ('t' in item && 'c' in item) {
        // Es un StockBar: necesitamos convertirlo al formato de la gráfica
        return {
          x: new Date(item.t).getTime(),
          y: item.c // Usamos el precio de cierre para la gráfica de línea
        };
      } else if ('x' in item && 'y' in item) {
        // Ya está en el formato correcto
        return item;
      } else {
        console.warn('Formato de dato inesperado:', item);
        return null;
      }
    }).filter(item => item !== null);
    
    // Actualizamos solo la serie de datos, manteniendo el resto de configuración
    if (this.chartOptions && this.chartOptions.series) {
      // Actualizamos solo los datos, manteniendo el resto de la configuración
      this.chartOptions.series = [{ name: symbol, data: seriesData }];
      this.chartOptions.title = {
        text: `${symbol} - Evolución de Precio`,
        align: 'left',
        style: { color: isDark ? '#FFFFFF' : '#333333' }
      };
        // Aplicamos directamente los colores según el tema actual sin llamar a updateChartTheme
      // para evitar bucles infinitos
      this.chartOptions.theme = { mode: isDark ? 'dark' : 'light' };
      
      // Forzamos la actualización del gráfico con el operador de propagación
      this.chartOptions = {...this.chartOptions};
    } else {
      // Si no existe configuración previa, creamos una nueva
      this.chartOptions = {
        series: [{ name: symbol, data: seriesData }],
        chart: {
          type: 'line',
          height: 350,
          animations: { enabled: true },
          toolbar: { show: false },
          background: 'transparent',
          zoom: { enabled: false }
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        title: {
          text: `${symbol} - Evolución de Precio`,
          align: 'left',
          style: { color: isDark ? '#FFFFFF' : '#333333' }
        },
        xaxis: {
          type: 'datetime',
          labels: { style: { colors: isDark ? '#FFFFFF' : '#333333' } },
          axisBorder: { show: true, color: isDark ? '#FFFFFF' : '#333333' },
          axisTicks: { show: true, color: isDark ? '#FFFFFF' : '#333333' }
        },
        yaxis: {
          labels: { style: { colors: isDark ? '#FFFFFF' : '#333333' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
          forceNiceScale: true,
          decimalsInFloat: 2
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          style: { fontSize: '12px', fontFamily: 'Helvetica, Arial, sans-serif' },
          x: { show: true, format: 'dd/MM/yyyy HH:mm' },
          y: { formatter: (val: number) => val.toFixed(2) + ' USD' },
          marker: { show: true }
        }
      }
    };
    
    this.isLoading = false;
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    
    // Simulamos una carga de datos de transacciones
    setTimeout(() => {
      this.transactions = [
        { 
          id: 'TX100523', 
          type: 'buy', 
          symbol: 'AAPL',
          shares: 10,
          price: 185.92,
          total: 1859.20,
          date: '2025-06-10'
        },
        { 
          id: 'TX100524', 
          type: 'sell', 
          symbol: 'MSFT',
          shares: 5,
          price: 337.50,
          total: 1687.50,
          date: '2025-06-09'
        },
        { 
          id: 'TX100525', 
          type: 'buy', 
          symbol: 'GOOGL',
          shares: 3,
          price: 131.86,
          total: 395.58,
          date: '2025-06-08'
        }
      ];
      this.isLoadingTransactions = false;
    }, 1200);
  }
  
  initializeChart(): void {
    const isDark = document.documentElement.classList.contains('dark');
    
    this.chartOptions = {
      series: [{ 
        name: this.currentSymbol,
        data: [] // Se llenará en preloadDefaultData()
      }],
      chart: {
        height: 350,
        type: 'line',
        zoom: { enabled: false },
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true }
      },
      title: { 
        text: `${this.currentSymbol} - Evolución de Precio`,
        align: 'left',
        style: { color: isDark ? '#FFFFFF' : '#333333' }
      },
      theme: { mode: isDark ? 'dark' : 'light' },
      xaxis: { 
        type: 'datetime',
        labels: {
          style: { colors: isDark ? '#FFFFFF' : '#333333' }
        },
        axisBorder: { show: true, color: isDark ? '#FFFFFF' : '#333333' },
        axisTicks: { show: true, color: isDark ? '#FFFFFF' : '#333333' }
      },
      yaxis: {
        labels: { 
          style: { colors: isDark ? '#FFFFFF' : '#333333' }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        forceNiceScale: true,
        decimalsInFloat: 2
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Helvetica, Arial, sans-serif'
        },
        x: {
          show: true,
          format: 'dd/MM/yyyy HH:mm'
        },
        y: {
          formatter: (val: number) => val.toFixed(2) + ' USD'
        },
        marker: { show: true }
      }
    };
  }
  
  /**
   * Precarga datos iniciales para el gráfico al cargar el componente
   * De esta forma no tenemos que esperar a que se cargue todo para ver datos
   */
  preloadDefaultData(): void {
    // Si no estamos usando datos mock, carga datos iniciales de Alpaca
    if (!this.useMockData) {
      // Inicializamos un spinner mientras se cargan los datos
      this.isLoading = true;
      
      // Usamos AAPL como símbolo por defecto (ya está en currentSymbol)
      this.alpacaService.getExtendedHistoricalData(
        this.currentSymbol,
        this.selectedPeriod,
        this.selectedTimeframe,
        { feed: 'iex' }
      ).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            console.log('Datos iniciales cargados con éxito para', this.currentSymbol);
            this.updateChartWithData(data, this.currentSymbol);
          } else {
            console.warn(`No hay datos disponibles para ${this.currentSymbol}, usando datos simulados`);
            const mockData = this.mockService.getMockData(this.currentSymbol);
            this.updateChartWithData(mockData, this.currentSymbol);
          }
        },
        error: (error) => {
          console.error(`Error al obtener datos iniciales para ${this.currentSymbol}:`, error);
          // En caso de error, usamos datos simulados
          const mockData = this.mockService.getMockData(this.currentSymbol);
          this.updateChartWithData(mockData, this.currentSymbol);
        }
      });
    } else {
      // Si usamos datos mock, cargamos datos simulados inmediatamente
      const mockData = this.mockService.getMockData(this.currentSymbol);
      this.updateChartWithData(mockData, this.currentSymbol);
    }
  }
  
  getCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'BRK.B': 'Berkshire Hathaway Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'JNJ': 'Johnson & Johnson'
    };
    
    return companies[symbol] || 'Desconocida';
  }
  
  getStatusClass(value: number): string {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
  
  /**
   * Cambia el timeframe y/o periodo y recarga los datos
   */
  changeTimeSettings(event?: any): void {
    // Aseguramos que siempre haya un timeframe válido por defecto
    if (!this.selectedTimeframe) {
      console.warn('Timeframe era null o undefined, estableciendo valor por defecto 1H');
      this.selectedTimeframe = '1H';
    }
    
    // Aseguramos que siempre haya un periodo válido por defecto
    if (!this.selectedPeriod) {
      console.warn('Periodo era null o undefined, estableciendo valor por defecto 30');
      this.selectedPeriod = 30;
    }
    
    console.log(`Cambiando configuración: timeframe=${this.selectedTimeframe}, periodo=${this.selectedPeriod}`);
    
    // Recargar datos con los nuevos parámetros
    this.loadChartData(this.currentSymbol);
  }
  
  /**
   * Alterna entre datos reales y datos simulados
   * Actualiza tanto el gráfico como la lista de observación
   */
  toggleDataMode(): void {
    this.useMockData = !this.useMockData;
    console.log(`Modo de datos cambiado a: ${this.useMockData ? 'Simulados' : 'Reales'}`);
    
    // Actualizamos el gráfico
    this.loadChartData(this.currentSymbol);
    
    // Actualizamos la watchlist según el modo
    if (this.useMockData) {
      // En modo simulado, cargamos datos simulados inmediatamente
      this.loadFallbackWatchlist();
    } else {
      // En modo real, cargamos datos reales
      this.loadWatchlistShares();
    }
  }
}
