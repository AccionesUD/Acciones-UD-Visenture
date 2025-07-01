import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from 'src/mail/mail.service';
import { Account } from 'src/accounts/entities/account.entity';
import { Logger } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { Share } from 'src/shares/entities/shares.entity';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly mailService: MailService) { }

  @Process('advisor-assigned')
  async handleAdvisorAssigned(job: Job<{
    advisorAccount: Account;
    clientAccount: Account;
  }>) {
    const { advisorAccount, clientAccount } = job.data;

    try {
      // Validación de datos básicos
      if (!advisorAccount?.id || !clientAccount?.id) {
        throw new HttpException('Datos de cuenta incompletos', 400);
      }

      if (!advisorAccount.email) {
        this.logger.warn(`No se puede enviar notificación: Comisionista ${advisorAccount.id} no tiene email`);
        throw new HttpException('Email del comisionista no configurado', 424); // 424 Failed Dependency
      }

      // Construcción de nombres con valores por defecto
      const advisorName = advisorAccount.user ?
        `${advisorAccount.user.first_name} ${advisorAccount.user.last_name}` : 'Comisionista';

      const clientName = clientAccount.user ?
        `${clientAccount.user.first_name} ${clientAccount.user.last_name}` : 'Cliente';

      // Intento de envío con manejo de errores específicos
      try {
        await this.mailService.sendAdvisorAssignedNotification(
          advisorAccount.email,
          advisorName,
          clientName
        );

        this.logger.log(`Notificación enviada al comisionista: ${advisorAccount.id}`);
        return { success: true, jobId: job.id.toString() };

      } catch (emailError) {
        this.logger.error(`Error técnico al enviar email: ${emailError.message}`, emailError.stack);
        throw new HttpException('Error técnico al enviar notificación', 502); // 502 Bad Gateway
      }

    } catch (error) {
      this.logger.error(`Error procesando notificación (Job ${job.id}): ${error.message}`, error.stack);

      // Clasificación de errores para reintentos
      const shouldRetry = !(error instanceof HttpException && error.getStatus() === 424);

      if (shouldRetry) {
        throw error; // BullMQ reintentará según la configuración
      }

      // Errores que no requieren reintento (como email no configurado)
      return {
        success: false,
        jobId: job.id.toString(),
        error: error.message,
        statusCode: error.getStatus?.() || 500
      };
    }
  }
  @Process('market-notification')
  async handleMarketNotification(job: Job<{
    account: Account;
    subject: string;
    message: string;
    stock: Stock;
    eventType: 'opening' | 'closing'
  }>) {
    const { account, subject, message, stock, eventType } = job.data;
    try {
      // Enviar solo si el usuario tiene habilitado el email
      if (account.email) {
        await this.mailService.sendMarketNotification(
          account.email,
          subject,
          message,
          stock,
          eventType
        );
        this.logger.log(`Notificación de mercado enviada a ${account.email} para ${eventType} de ${stock.name_market}`);
      }
    } catch (error) {
      this.logger.error(`Error enviando notificación de mercado: ${error.message}`, error.stack);
      throw error;
    }
  }
  @Process('price-alert')
  async handlePriceAlert(job: Job<{
    account: Account;
    subject: string;
    message: string;
    share: Share;
    targetPrice: number;
    currentPrice: number;
    direction: string;
  }>) {
    const { account, subject, message, share } = job.data;

    try {
      if (account.email) {
        await this.mailService.sendPriceAlertNotification(
          account.email,
          subject,
          message,
          share,
          job.data.targetPrice,
          job.data.currentPrice,
          job.data.direction
        );
        this.logger.log(`Notificación de alerta de precio enviada a: ${account.email}`);
      }
    } catch (error) {
      this.logger.error(`Error enviando notificación de alerta de precio: ${error.message}`, error.stack);
      throw error;
    }
  }

}