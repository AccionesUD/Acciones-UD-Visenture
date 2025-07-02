import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorService } from './advisor.service';
import { AdvisorController } from './advisor.controller';
import { Account } from '../accounts/entities/account.entity';
import { Role } from '../roles-permission/entities/role.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Role]),
    NotificationsModule,
  ],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService],
})
export class AdvisorModule {}