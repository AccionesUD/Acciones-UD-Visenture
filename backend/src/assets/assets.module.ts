import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './services/assets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './assets.entity';
import { AccountsModule } from '../accounts/accounts.module'; // 👈 AGREGA ESTO

@Module({
  imports: [TypeOrmModule.forFeature([Asset]), AccountsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
