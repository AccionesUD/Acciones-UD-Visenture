import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from 'src/mail/mail.service';
import { Account } from 'src/accounts/entities/account.entity';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('advisor-assigned')
  async handleAdvisorAssigned(job: Job<{
    advisorAccount: Account;
    clientAccount: Account;
  }>) {
    const { advisorAccount, clientAccount } = job.data;
    
    try {
      if (!advisorAccount.email) {
        this.logger.warn(`No se puede enviar notificación: Comisionista ${advisorAccount.id} no tiene email`);
        return;
      }

      const advisorName = advisorAccount.user ? 
        `${advisorAccount.user.first_name} ${advisorAccount.user.last_name}` : 'Comisionista';
      
      const clientName = clientAccount.user ? 
        `${clientAccount.user.first_name} ${clientAccount.user.last_name}` : 'Cliente';

      await this.mailService.sendAdvisorAssignedNotification(
        advisorAccount.email,
        advisorName,
        clientName
      );
      
      this.logger.log(`Notificación enviada al comisionista: ${advisorAccount.id}`);
    } catch (error) {
      this.logger.error(`Error procesando notificación: ${error.message}`, error.stack);
      throw error; // Para reintentos
    }
  }
}