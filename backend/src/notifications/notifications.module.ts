// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './notifications.processor';
import { MailModule } from '../mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationSettings } from './entities/notifications-settings.entity';
import { Account } from '../accounts/entities/account.entity';
import { NotificationSettingsService } from './notification-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSettings, Account]), // ¡Añade esto primero!
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    MailModule,
    
  ],
  providers: [
    NotificationsService,
    NotificationProcessor,
    NotificationSettingsService,
  ],
  exports: [
    NotificationsService,
    NotificationSettingsService,

  ],
})
export class NotificationsModule {}