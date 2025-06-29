import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Account } from 'src/accounts/entities/account.entity';
import { MailService } from 'src/mail/mail.service';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { Share } from 'src/shares/entities/shares.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly mailService: MailService,
  ) { }

  async sendAdvisorAssignedNotification(
    advisorAccount: Account,
    clientAccount: Account
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    try {
      if (!advisorAccount?.email) {
        throw new HttpException(
          'La cuenta del comisionista no tiene email configurado',
          HttpStatus.BAD_REQUEST
        );
      }

      const job = await this.notificationsQueue.add(
        'advisor-assigned',
        {
          advisorAccount,
          clientAccount,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        }
      );

      this.logger.log(
        `Trabajo de notificación encolado para: ${advisorAccount.id}. Job ID: ${job.id}`
      );

      return {
        success: true,
        message: 'Notificación de asignación encolada correctamente',
        notificationId: job.id.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Error al encolar notificación: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error al programar la notificación de asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendMarketNotification(
    account: Account,
    stock: Stock,
    eventType: 'opening' | 'closing'
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    try {
      const eventName = eventType === 'opening' ? 'Apertura' : 'Cierre';
      const actionText = eventType === 'opening' ? 'ha abierto' : 'ha cerrado';
      const subject = `Mercado ${stock.name_market} ${actionText}`;
      const message = `El mercado ${stock.name_market} (${stock.mic}) ${actionText}.`;
      const job = await this.notificationsQueue.add(
        'market-notification',
        {
          account,
          subject,
          message,
          stock,
          eventType,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        }
      );
      this.logger.log(
        `Notificacion de mercado encolada para: ${account.email}. Job ID: ${job.id}`
      );
      return {
        success: true,
        message: `Notificación de ${eventName} del mercado encolada correctamente`,
        notificationId: job.id.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Error al encolar notificación de mercado: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Error al programar la notificación de mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendPriceAlertNotification(
    account: Account,
    share: Share,
    targetPrice: number,
    direction: 'above' | 'below',
    currentPrice: number
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    try {
      const directionText = direction === 'above' ? 'por encima' : 'por debajo';
      const subject = `Alerta de precio activada para ${share.symbol}`;
      const message = `El precio de ${share.name_share} (${share.symbol}) ha alcanzado ${currentPrice}, que está ${directionText} de ${targetPrice}.`;

      const job = await this.notificationsQueue.add(
        'price-alert',
        {
          account,
          subject,
          message,
          share,
          targetPrice,
          currentPrice,
          direction
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        }
      );

      this.logger.log(
        `Notificación de alerta de precio encolada para: ${account.email}. Job ID: ${job.id}`
      );

      return {
        success: true,
        message: 'Notificación de alerta de precio encolada correctamente',
        notificationId: job.id.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Error al encolar notificación de alerta de precio: ${error.message}`,
        error.stack
      );

      throw new HttpException(
        'Error al programar la notificación de alerta de precio',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}