import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NotificationsService } from '../../services/notifications.service';
import { ProfileService } from '../../services/profile.service';
import { UsersService } from '../../services/user.service';
import { PriceAlert, NotificationMethod, NotificationSettings, UserPreferences } from '../../models/notification.model';


@Component({
  selector: 'app-preferences',  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSlideToggleModule
  ],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css'
})
export class PreferencesComponent implements OnInit, AfterViewInit {
  @ViewChild('tabsNav') tabsNavRef!: ElementRef;
  @ViewChild('tabsContainer') tabsContainerRef!: ElementRef;
  activeTabIndex: number = 0;
  //Rol del usuario
  userRole: string | null = null;

  // Variables para control de desplazamiento
  showLeftScrollButton: boolean = false;
  showRightScrollButton: boolean = false;
  
  // Configuración de alertas
  priceAlerts: PriceAlert[] = [];
  notificationSettings: NotificationSettings | null = null;
  userPreferences: UserPreferences | null = null;
  
  // Datos para autocompletado
  stockTickers: {ticker: string, name: string}[] = [
    {ticker: 'AAPL', name: 'Apple Inc.'},
    {ticker: 'MSFT', name: 'Microsoft Corporation'},
    {ticker: 'GOOGL', name: 'Alphabet Inc.'},
    {ticker: 'AMZN', name: 'Amazon.com Inc.'},
    {ticker: 'META', name: 'Meta Platforms Inc.'},
    {ticker: 'TSLA', name: 'Tesla Inc.'},
    {ticker: 'NVDA', name: 'NVIDIA Corporation'},
    {ticker: 'JPM', name: 'JPMorgan Chase & Co.'},
    {ticker: 'V', name: 'Visa Inc.'},
    {ticker: 'WMT', name: 'Walmart Inc.'}
  ];
  filteredTickers: Observable<{ticker: string, name: string}[]> = of([]);
  
  // Formularios
  alertForm: FormGroup;
  notificationMethodForm: FormGroup;
  marketSettingsForm: FormGroup;
  tradeSettingsForm: FormGroup;
  
  // Estado de la interfaz
  loading = {
    alerts: false,
    settings: false,
    saving: false
  };
  editingAlertId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationsService: NotificationsService,
    private profileService: ProfileService,
    private userService: UsersService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Inicializar formularios
    this.alertForm = this.fb.group({
      ticker: ['', [Validators.required, Validators.maxLength(10)]],
      stock_name: [''],
      target_price: ['', [Validators.required, Validators.min(0.01)]],
      condition: ['above', Validators.required],
      active: [true]
    });
    
    // Valores por defecto para el formulario de métodos de notificación
    this.notificationMethodForm = this.fb.group({
      email: [true],
      push: [true],
      sms: [false],
      whatsapp: [false]
    });
    
    // Configuración para mercados
    this.marketSettingsForm = this.fb.group({
      default_market: ['NYSE', Validators.required],
      auto_refresh: [true],
      refresh_interval: [5, [Validators.required, Validators.min(1), Validators.max(60)]],
      show_after_hours: [true]
    });
    // Configuración para operaciones
    this.tradeSettingsForm = this.fb.group({
      default_order_type: ['market', Validators.required],
      max_operations_per_day: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      confirm_large_orders: [true],
      enable_stop_loss: [true],
      stop_loss_percentage: [10, [Validators.required, Validators.min(1), Validators.max(50)]]
    });
  }

  ngOnInit(): void {
    this.userService.getUserRole().subscribe({
      next: role => this.userRole = role ?? null
    });
    this.loadPriceAlerts();
    this.loadNotificationSettings();
    this.loadUserPreferences();
    this.loadAvailableTickers();
    
    // Configurar el autocompletado para tickers
    this.filteredTickers = this.alertForm.get('ticker')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTickers(value || ''))
    );
    
    // Cuando el ticker cambia, actualizar el nombre de la acción si está disponible
    this.alertForm.get('ticker')!.valueChanges.subscribe(ticker => {
      if (ticker) {
        const stock = this.stockTickers.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
        if (stock) {
          this.alertForm.get('stock_name')!.setValue(stock.name);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.checkTabsOverflow();
    setTimeout(() => this.checkTabsOverflow(), 100); // Verificar después de renderizar completamente
  }
  
  // Escuchar los cambios de tamaño del navegador
  @HostListener('window:resize')
  onResize(): void {
    this.checkTabsOverflow();
  }
  
  // Verificar si las pestañas desbordan el contenedor
  checkTabsOverflow(): void {
    if (this.tabsNavRef && this.tabsContainerRef) {
      const navElement = this.tabsNavRef.nativeElement;
      const containerWidth = navElement.clientWidth;
      const scrollWidth = navElement.scrollWidth;
      
      this.showRightScrollButton = scrollWidth > containerWidth && navElement.scrollLeft < scrollWidth - containerWidth;
      this.showLeftScrollButton = navElement.scrollLeft > 0;
    }
  }
  
  // Desplazamiento horizontal de las pestañas
  scrollTabs(direction: 'left' | 'right'): void {
    if (this.tabsNavRef) {
      const navElement = this.tabsNavRef.nativeElement;
      const scrollAmount = 150; // Cantidad de píxeles para desplazar
      
      if (direction === 'left') {
        navElement.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        navElement.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      // Actualizar visibilidad de botones después del desplazamiento
      setTimeout(() => this.checkTabsOverflow(), 300);
    }
  }
  
  // Cargar alertas de precio
  loadPriceAlerts(): void {
    this.loading.alerts = true;
    this.notificationsService.getPriceAlerts().subscribe({
      next: (alerts) => {
        this.priceAlerts = alerts;
        this.loading.alerts = false;
      },
      error: (error) => {
        console.error('Error loading price alerts:', error);
        this.loading.alerts = false;
        this.snackBar.open('Error al cargar las alertas de precio', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Cargar configuración de notificaciones
  loadNotificationSettings(): void {
    this.loading.settings = true;
    this.notificationsService.getNotificationSettings().subscribe({
      next: (settings) => {
        this.notificationSettings = settings;
        this.loading.settings = false;
      },
      error: (error) => {
        console.error('Error loading notification settings:', error);
        this.loading.settings = false;
        this.snackBar.open('Error al cargar la configuración de notificaciones', 'Cerrar', { duration: 5000 });
      }
    });
  }  // Cargar preferencias de usuario
  loadUserPreferences(): void {
    this.profileService.getUserPreferences().subscribe({
      next: (preferences) => {
        this.userPreferences = preferences;
        
        // Si hay métodos de notificación guardados, actualizar el formulario
        if (preferences.notification_methods) {
          this.notificationMethodForm.patchValue({
            email: preferences.notification_methods.email,
            push: preferences.notification_methods.push,
            sms: preferences.notification_methods.sms,
            whatsapp: preferences.notification_methods.whatsapp
          });
        }
        
        // Actualizar el formulario de configuraciones de operaciones
        this.tradeSettingsForm.patchValue({
          default_order_type: preferences.default_order_type || 'market',
          max_operations_per_day: preferences.daily_operations_limit || 10,
          confirm_large_orders: preferences.confirm_large_orders
        });
      },
      error: (error) => {
        console.error('Error loading user preferences:', error);
        this.snackBar.open('Error al cargar las preferencias de usuario', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Cargar tickers disponibles desde el servicio
  loadAvailableTickers(): void {
    this.profileService.getAvailableTickers().subscribe({
      next: (tickers) => {
        this.stockTickers = tickers;
        // Actualizar el filtro después de cargar los nuevos datos
        this.filteredTickers = of(this._filterTickers(this.alertForm.get('ticker')?.value || ''));
      },
      error: (error) => {
        console.error('Error loading tickers:', error);
        this.snackBar.open('Error al cargar la lista de tickers', 'Cerrar', { duration: 5000 });
      }
    });
  }
    // Filtrar tickers basado en la entrada del usuario
  private _filterTickers(value: string): {ticker: string, name: string}[] {
    if (!value || value.length < 1) {
      return this.stockTickers.slice(0, 8); // Mostrar algunos resultados iniciales
    }
    
    const filterValue = value.toLowerCase();
    
    // Primero buscar coincidencias exactas al inicio del ticker
    const exactTickerMatches = this.stockTickers.filter(stock => 
      stock.ticker.toLowerCase().startsWith(filterValue)
    );
    
    // Luego buscar coincidencias en cualquier parte del nombre
    const nameMatches = this.stockTickers.filter(stock => 
      stock.name.toLowerCase().includes(filterValue) &&
      !exactTickerMatches.includes(stock) // Evitar duplicados
    );
    
    // Finalmente cualquier otra coincidencia en ticker
    const otherTickerMatches = this.stockTickers.filter(stock => 
      stock.ticker.toLowerCase().includes(filterValue) &&
      !stock.ticker.toLowerCase().startsWith(filterValue) &&
      !nameMatches.includes(stock)
    );
    
    // Combinar los resultados priorizando las coincidencias exactas
    return [...exactTickerMatches, ...nameMatches, ...otherTickerMatches];
  }

  // Crear una nueva alerta de precio
  createAlert(): void {
    if (this.alertForm.invalid) {
      return;
    }
    
    this.loading.saving = true;
    const newAlert = this.alertForm.value;
    
    this.notificationsService.createPriceAlert(newAlert).subscribe({
      next: (alert) => {
        this.priceAlerts.push(alert);
        this.resetAlertForm();
        this.loading.saving = false;
        this.snackBar.open('Alerta de precio creada con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating price alert:', error);
        this.loading.saving = false;
        this.snackBar.open('Error al crear la alerta de precio', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Editar alerta existente
  editAlert(alert: PriceAlert): void {
    this.editingAlertId = alert.id;
    this.alertForm.patchValue({
      ticker: alert.ticker,
      stock_name: alert.stock_name || '',
      target_price: alert.target_price,
      condition: alert.condition,
      active: alert.active
    });
  }

  // Cancelar edición
  cancelEdit(): void {
    this.editingAlertId = null;
    this.resetAlertForm();
  }

  // Actualizar alerta existente
  updateAlert(): void {
    if (this.alertForm.invalid || this.editingAlertId === null) {
      return;
    }
    
    this.loading.saving = true;
    const updatedAlert = this.alertForm.value;
    
    this.notificationsService.updatePriceAlert(this.editingAlertId, updatedAlert).subscribe({
      next: (alert) => {
        const index = this.priceAlerts.findIndex(a => a.id === this.editingAlertId);
        if (index !== -1) {
          this.priceAlerts[index] = alert;
        }
        this.editingAlertId = null;
        this.resetAlertForm();
        this.loading.saving = false;
        this.snackBar.open('Alerta de precio actualizada con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating price alert:', error);
        this.loading.saving = false;
        this.snackBar.open('Error al actualizar la alerta de precio', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Eliminar alerta
  deleteAlert(alertId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta alerta?')) {
      this.notificationsService.deletePriceAlert(alertId).subscribe({
        next: () => {
          this.priceAlerts = this.priceAlerts.filter(alert => alert.id !== alertId);
          this.snackBar.open('Alerta eliminada con éxito', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting price alert:', error);
          this.snackBar.open('Error al eliminar la alerta', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
  // Guardar métodos de notificación
  saveNotificationMethods(): void {
    if (this.notificationMethodForm.invalid) {
      return;
    }
    
    this.loading.saving = true;
    const methods = this.notificationMethodForm.value as NotificationMethod;
    
    if (this.userPreferences) {
      // En un entorno real, aquí integraríamos con el backend
      // Actualizamos en la preferencia del usuario los métodos de notificación
      const updatedPreferences: Partial<UserPreferences> = {
        notification_methods: methods
      };
      
      this.profileService.saveUserPreferences(updatedPreferences).subscribe({
        next: (prefs) => {
          this.userPreferences = prefs;
          this.loading.saving = false;
          this.snackBar.open('Métodos de notificación guardados con éxito', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error al guardar los métodos de notificación:', error);
          this.loading.saving = false;
          this.snackBar.open('Error al guardar los métodos de notificación', 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // Fallback en caso de que no tengamos userPreferences cargadas
      setTimeout(() => {
        this.loading.saving = false;
        this.snackBar.open('Métodos de notificación guardados con éxito', 'Cerrar', { duration: 3000 });
      }, 1000);
    }
  }

  // Resetear formulario de alerta
  private resetAlertForm(): void {
    this.alertForm.reset({
      ticker: '',
      stock_name: '',
      target_price: '',
      condition: 'above',
      active: true
    });
  }
  // Actualizar estado de notificaciones
  updateNotificationSettings(): void {
    if (!this.notificationSettings) return;
    
    this.loading.saving = true;
    this.notificationsService.saveNotificationSettings(this.notificationSettings).subscribe({
      next: (settings) => {
        this.notificationSettings = settings;
        this.loading.saving = false;
        this.snackBar.open('Configuración de notificaciones actualizada', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating notification settings:', error);
        this.loading.saving = false;
        this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 5000 });
      }
    });
  }
  // Guardar configuración de mercados y sectores
  saveMarketSettings(): void {
    if (!this.userPreferences) {
      return;
    }
    
    this.loading.saving = true;
    
    // Recopilar los mercados seleccionados
    const selectedMarkets: string[] = [];
    const marketCheckboxes = document.querySelectorAll('[id^="market-"]');
    marketCheckboxes.forEach((checkbox: any) => {
      if (checkbox.checked) {
        // Extraer el código del mercado del ID (quitar el prefijo "market-")
        const marketCode = checkbox.id.substring(7).toUpperCase();
        selectedMarkets.push(marketCode);
      }
    });
    
    // Recopilar los sectores seleccionados
    const selectedSectors: string[] = [];
    const sectorCheckboxes = document.querySelectorAll('[id^="sector-"]');
    sectorCheckboxes.forEach((checkbox: any) => {
      if (checkbox.checked) {
        // Extraer el código del sector del ID (quitar el prefijo "sector-")
        const sectorCode = checkbox.id.substring(7);
        // Convertir primera letra a mayúscula (por ej. "tech" → "Tech")
        const sectorName = sectorCode.charAt(0).toUpperCase() + sectorCode.slice(1);
        selectedSectors.push(sectorName);
      }
    });
    
    // Actualizar las preferencias del usuario
    const updatedPreferences: Partial<UserPreferences> = {
      favorite_markets: selectedMarkets,
      favorite_sectors: selectedSectors
    };
    
    this.profileService.saveUserPreferences(updatedPreferences).subscribe({
      next: (prefs) => {
        this.userPreferences = prefs;
        this.loading.saving = false;
        this.snackBar.open('Configuración de mercados guardada con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al guardar la configuración de mercados:', error);
        this.loading.saving = false;
        this.snackBar.open('Error al guardar la configuración', 'Cerrar', { duration: 5000 });
      }
    });
  }
  // Guardar configuración de operaciones
  saveTradeSettings(): void {
    if (this.tradeSettingsForm.invalid || !this.userPreferences) {
      return;
    }
    
    this.loading.saving = true;
    const tradeSettings = this.tradeSettingsForm.value;
    
    // Crear el objeto de preferencias actualizadas
    const updatedPreferences: Partial<UserPreferences> = {
      default_order_type: tradeSettings.default_order_type,
      daily_operations_limit: tradeSettings.max_operations_per_day,
      confirm_large_orders: tradeSettings.confirm_large_orders
    };
    
    // Enviar al servicio
    this.profileService.saveUserPreferences(updatedPreferences).subscribe({
      next: (prefs) => {
        this.userPreferences = prefs;
        this.loading.saving = false;
        this.snackBar.open('Configuración de operaciones guardada con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al guardar la configuración de operaciones:', error);
        this.loading.saving = false;
        this.snackBar.open('Error al guardar la configuración', 'Cerrar', { duration: 5000 });
      }
    });
  }
}
