import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
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
}