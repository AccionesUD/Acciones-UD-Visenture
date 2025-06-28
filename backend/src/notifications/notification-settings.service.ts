// import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { SettingMailing } from '../preferences/entities/setting-mailing.entity';
// import { Account } from 'src/accounts/entities/account.entity';
// import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

// @Injectable()
// export class NotificationSettingsService {
//   private readonly logger = new Logger(NotificationSettingsService.name);

//   constructor(
//     @InjectRepository(SettingMailing)
//     private readonly settingsRepo: Repository<SettingMailing>,
//     @InjectRepository(Account)
//     private readonly accountRepo: Repository<Account>,
//   ) {}

//   async createDefaultSettings(account: Account): Promise<SettingMailing> {
//     try {
//       const settings = this.settingsRepo.create({
//         account,
//         emailEnabled: true,
//         smsEnabled: false,
//         whatsappEnabled: false
//       });
//       return await this.settingsRepo.save(settings);
//     } catch (error) {
//       this.logger.error(`Error creando configuración por defecto: ${error.message}`);
//       throw new HttpException('Error al crear configuración de notificaciones', HttpStatus.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async updateSettings(
//     accountId: string,
//     updateDto: UpdateNotificationSettingsDto
//   ): Promise<{ success: boolean; data: SettingSending; message?: string }> {
//     try {
//       const account = await this.accountRepo.findOne({
//         where: { identity_document: accountId },
//         relations: ['notificationSettings']
//       });

//       if (!account) {
//         throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
//       }

//       if (!account.notificationSettings) {
//         account.notificationSettings = await this.createDefaultSettings(account);
//       }

//       // Actualizar campos
//       if (updateDto.emailEnabled !== undefined) {
//         account.notificationSettings.emailEnabled = updateDto.emailEnabled;
//       }
//       if (updateDto.smsEnabled !== undefined) {
//         account.notificationSettings.smsEnabled = updateDto.smsEnabled;
//       }
//       if (updateDto.whatsappEnabled !== undefined) {
//         account.notificationSettings.whatsappEnabled = updateDto.whatsappEnabled;
//       }
//       if (updateDto.phoneNumber !== undefined) {
//         account.notificationSettings.phoneNumber = updateDto.phoneNumber;
//       }

//       const savedSettings = await this.settingsRepo.save(account.notificationSettings);
      
//       return {
//         success: true,
//         data: savedSettings,
//         message: 'Configuración de notificaciones actualizada exitosamente'
//       };
//     } catch (error) {
//       this.logger.error(`Error actualizando configuración: ${error.message}`);
      
//       if (error instanceof HttpException) {
//         throw error;
//       }
      
//       throw new HttpException('Error al actualizar configuración de notificaciones', HttpStatus.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async getSettings(accountId: string): Promise<{ 
//   success: boolean; 
//   data?: {
//     emailEnabled: boolean;
//     smsEnabled: boolean;
//     whatsappEnabled: boolean;
//     phoneNumber?: string;
//   }; 
//   message?: string 
// }> {
//   try {
//     const account = await this.accountRepo.findOne({
//       where: { identity_document: accountId },
//       relations: ['notificationSettings'],
//       select: ['id', 'notificationSettings'] // Solo seleccionamos lo necesario
//     });

//     if (!account) {
//       throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
//     }

//     // Si no existe configuración, creamos una por defecto
//     if (!account.notificationSettings) {
//       account.notificationSettings = await this.createDefaultSettings(account);
//       await this.accountRepo.save(account);
//     }

//     // Extraemos solo los campos relevantes
//     const { emailEnabled, smsEnabled, whatsappEnabled, phoneNumber } = account.notificationSettings;

//     return {
//       success: true,
//       data: {
//         emailEnabled,
//         smsEnabled,
//         whatsappEnabled,
//         phoneNumber
//       }
//     };
//   } catch (error) {
//     this.logger.error(`Error obteniendo configuración: ${error.message}`);
    
//     if (error instanceof HttpException) {
//       throw error;
//     }
    
//     throw new HttpException('Error al obtener configuración de notificaciones', HttpStatus.INTERNAL_SERVER_ERROR);
//   }
// }
// }