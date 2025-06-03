// src/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensService } from './tokens.service';
import { tokenEmail } from './entities/token-email.entity';
import { ConfigModule } from '@nestjs/config';
import { GenerateToken2MFA } from './services/generate-token.provider';

@Module({
  imports: [ConfigModule,TypeOrmModule.forFeature([tokenEmail])],
  providers: [TokensService, GenerateToken2MFA],
  exports: [TokensService, GenerateToken2MFA],
})
export class TokensModule {}
