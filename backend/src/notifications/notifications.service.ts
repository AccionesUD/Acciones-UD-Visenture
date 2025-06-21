import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Account } from 'src/accounts/entities/account.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly mailService: MailService,
  ) {}

  async sendAdvisorAssignedNotification(
    advisorAccount: Account,
    clientAccount: Account
  ): Promise<void> {
    try {
      // Agregar trabajo a la cola
      await this.notificationsQueue.add('advisor-assigned', {
        advisorAccount,
        clientAccount
      }, {
        attempts: 3, // Reintentos
        backoff: {
          type: 'exponential', // Retardo exponencial
          delay: 5000, // 5 segundos iniciales
        },
        removeOnComplete: true, // Eliminar trabajos completados
      });
      
      this.logger.log(`Trabajo de notificación encolado para: ${advisorAccount.id}`);
    } catch (error) {
      this.logger.error(`Error al encolar notificación: ${error.message}`, error.stack);
    }
  }
}