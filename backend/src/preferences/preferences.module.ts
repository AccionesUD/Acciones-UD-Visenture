// src/preferences/preferences.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { PreferenceAccount } from './entities/preference-account.entity';
import { SettingNotification } from './entities/setting-notification.entity';
import { SettingOperation } from './entities/setting-operation.entity';
import { SettingBriefcase } from './entities/setting-briefcase.entity';
import { SettingMailing } from './entities/setting-mailing.entity';
import { AccountsModule } from 'src/accounts/accounts.module';
import { Account } from 'src/accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      PreferenceAccount,
      SettingNotification,
      SettingOperation,
      SettingBriefcase,
      SettingMailing,
    ]),
    forwardRef(() => AccountsModule),
  ],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService]
})
export class PreferencesModule {}