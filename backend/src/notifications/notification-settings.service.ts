import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSettings } from './entities/notifications-settings.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly settingsRepo: Repository<NotificationSettings>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  // Crear configuración por defecto
  async createDefaultSettings(account: Account): Promise<NotificationSettings> {
    const settings = this.settingsRepo.create({
      account,
      emailEnabled: true,
      smsEnabled: false,
      whatsappEnabled: false
    });
    return this.settingsRepo.save(settings);
  }

  // Actualizar configuración
  async updateSettings(
    accountId: string,
    updateDto: UpdateNotificationSettingsDto
  ): Promise<NotificationSettings> {
    const account = await this.accountRepo.findOne({
      where: { identity_document: accountId },
      relations: ['notificationSettings']
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    // Si no existe configuración, creamos una
    if (!account.notificationSettings) {
      account.notificationSettings = await this.createDefaultSettings(account);
    }

    // Actualizar campos
    if (updateDto.emailEnabled !== undefined) {
      account.notificationSettings.emailEnabled = updateDto.emailEnabled;
    }
    if (updateDto.smsEnabled !== undefined) {
      account.notificationSettings.smsEnabled = updateDto.smsEnabled;
    }
    if (updateDto.whatsappEnabled !== undefined) {
      account.notificationSettings.whatsappEnabled = updateDto.whatsappEnabled;
    }
    if (updateDto.phoneNumber !== undefined) {
      account.notificationSettings.phoneNumber = updateDto.phoneNumber;
    }

    return this.settingsRepo.save(account.notificationSettings);
  }

  // Obtener configuración
  async getSettings(accountId: string): Promise<NotificationSettings> {
    const account = await this.accountRepo.findOne({
      where: { identity_document: accountId },
      relations: ['notificationSettings']
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    // Si no existe configuración, creamos una por defecto
    if (!account.notificationSettings) {
      account.notificationSettings = await this.createDefaultSettings(account);
      await this.accountRepo.save(account);
    }

    return account.notificationSettings;
  }
}