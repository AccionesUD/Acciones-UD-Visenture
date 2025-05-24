// src/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensService } from './tokens.service';
import { LoginToken } from './entities/login-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoginToken])],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
