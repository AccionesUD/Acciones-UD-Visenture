import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './services/assets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './assets.entity';
import { AccountsModule } from '../accounts/accounts.module'; 
import { Stock } from 'src/stocks/stocks.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Stock]), 
    AccountsModule,
    HttpModule
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
