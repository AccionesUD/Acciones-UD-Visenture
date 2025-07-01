// src/price-alerts/price-alerts-checker.service.ts
import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PriceAlertsService } from './price-alerts.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AlertStatus, PriceAlert } from 'src/price-alerts/entitites/price-alert.entity';
import { AlpacaTradingService } from 'src/alpaca_trading/alpaca-trading.service';
import { ServicesService } from 'src/stocks/services/services.service';

export class PriceAlertError extends HttpException {
  constructor(message: string, status: HttpStatus, public readonly alertId?: number, public readonly symbol?: string) {
    super({ message, alertId, symbol }, status);
  }
}

@Injectable()
export class PriceAlertsCheckerService implements OnModuleInit {
  private readonly logger = new Logger(PriceAlertsCheckerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private alertsService: PriceAlertsService,
    private notificationsService: NotificationsService,
    private alpacaTradingService: AlpacaTradingService,
    private stocksService: ServicesService
  ) { }

  onModuleInit() {
    const job = new CronJob('* * * * *', async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        this.logger.error(`Error in price alerts check job: ${error.message}`, error.stack);
        // Puedes agregar notificación a administradores aquí
      }
    });

    this.schedulerRegistry.addCronJob('price-alerts-check', job);
    job.start();
    this.logger.log('Scheduled price alerts checker');
  }

  async checkAlerts(): Promise<{ processed: number; errors: PriceAlertError[] }> {
    this.logger.log('Checking price alerts...');
    const errors: PriceAlertError[] = [];
    let processed = 0;

    try {
      const alerts = await this.alertsService.findAllActive();

      for (const alert of alerts) {
        try {
          processed += await this.processAlert(alert);
        } catch (error) {
          this.handleAlertError(error, alert, errors);
        }
      }

      if (errors.length > 0) {
        this.logger.warn(`Completed with ${errors.length} errors`);
      }

      return { processed, errors };
    } catch (error) {
      this.logger.error(`Global error checking alerts: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error processing alerts',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async processAlert(alert: PriceAlert): Promise<number> {
    // Obtener mercado de la acción
    const marketMic = alert.share.stock.mic;

    // Verificar si el mercado está abierto
    const isMarketOpen = await this.stocksService.isMarketOpen(marketMic);
    if (!isMarketOpen) {
      this.logger.log(`Market closed for ${alert.share.symbol}, skipping check.`);
      return 0; // No incrementar processed count
    }

    // Obtener el precio actual
    const currentPrice = await this.alpacaTradingService.getCurrentPrice(alert.share.symbol);

    if (this.isConditionMet(alert, currentPrice)) {
      await this.notificationsService.sendPriceAlertNotification(
        alert.account,
        alert.share,
        alert.target_price,
        alert.direction,
        currentPrice
      );

      if (!alert.is_recurring) {
        await this.alertsService.updateStatus(alert.id, AlertStatus.TRIGGERED);
      }

      this.logger.log(`Alert ${alert.id} for ${alert.share.symbol} triggered`);
      return 1;
    }
    return 0;
  }

  private handleAlertError(error: any, alert: PriceAlert, errors: PriceAlertError[]): void {
    let httpError: PriceAlertError;

    if (error instanceof HttpException) {
      httpError = new PriceAlertError(
        error.message,
        error.getStatus(),
        alert.id,
        alert.share.symbol
      );
    } else {
      httpError = new PriceAlertError(
        `Failed to process alert: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        alert.id,
        alert.share.symbol
      );
    }

    this.logger.error(`Error processing alert ${alert.id} for ${alert.share.symbol}: ${error.message}`, error.stack);
    errors.push(httpError);
  }

  private isConditionMet(alert: PriceAlert, currentPrice: number): boolean {
    if (alert.direction === 'above') {
      return currentPrice >= alert.target_price;
    }
    return currentPrice <= alert.target_price;
  }
}