import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module'; // 👈 AGREGA ESTO

@Module({
  imports: [AccountsModule]
})
export class AssetsModule {}
