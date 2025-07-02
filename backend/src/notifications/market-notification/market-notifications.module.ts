// src/market-notifications/market-notifications.module.ts
import { Module } from '@nestjs/common';
import { MarketNotificationsService } from './market-notifications.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { PreferencesModule } from '../../preferences/preferences.module'; 
import { NotificationsModule } from '../notifications.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock]),
    PreferencesModule,
    NotificationsModule
  ],
  providers: [MarketNotificationsService, SchedulerRegistry]
})
export class MarketNotificationsModule {}