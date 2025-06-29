// src/market-notifications/market-notifications.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { NotificationsService } from '../notifications.service';
import { PreferencesService } from '../../preferences/preferences.service'; // Ensure this path is correct and the file exists

@Injectable()
export class MarketNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(MarketNotificationsService.name);

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: PreferencesService,
  ) {}

  async onModuleInit() {
    this.logger.log('Scheduling market notifications...');
    await this.scheduleMarketNotifications();
  }

  private async scheduleMarketNotifications() {
    const stocks = await this.stockRepository.find();
    
    for (const stock of stocks) {
      // Programar notificación de apertura
      if (stock.opening_time) {
        const openingCron = this.convertTimeToCron(stock.opening_time);
        this.scheduleJob(
          `market-open-${stock.mic}`,
          openingCron,
          stock,
          'opening'
        );
      }

      // Programar notificación de cierre
      if (stock.closing_time) {
        const closingCron = this.convertTimeToCron(stock.closing_time);
        this.scheduleJob(
          `market-close-${stock.mic}`,
          closingCron,
          stock,
          'closing'
        );
      }
    }
    
    this.logger.log(`Scheduled notifications for ${stocks.length} markets`);
  }

  private scheduleJob(
    name: string,
    cronTime: string,
    stock: Stock,
    eventType: 'opening' | 'closing'
  ) {
    const job = new CronJob(cronTime, async () => {
      this.logger.log(`Triggering ${eventType} notification for ${stock.mic}`);
      await this.sendMarketNotifications(stock, eventType);
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    
    this.logger.debug(`Scheduled job ${name} at ${cronTime}`);
  }

  private convertTimeToCron(time: string): string {
    // Convertir formato "HH:MM" a cron "MM HH * * *"
    const [hours, minutes] = time.split(':');
    return `${minutes} ${hours} * * *`;
  }

  private async sendMarketNotifications(
    stock: Stock,
    eventType: 'opening' | 'closing'
  ) {
    try {
      // Obtener todas las cuentas con notificaciones de mercado activadas
      const accounts = await this.preferencesService.getAccountsWithMarketNotifications();
      
      // Enviar notificación a cada cuenta
      for (const account of accounts) {
        await this.notificationsService.sendMarketNotification(
          account,
          stock,
          eventType
        );
      }
      
      this.logger.log(`Sent ${eventType} notifications for ${stock.mic} to ${accounts.length} accounts`);
    } catch (error) {
      this.logger.error(`Error sending market notifications: ${error.message}`, error.stack);
    }
  }
}