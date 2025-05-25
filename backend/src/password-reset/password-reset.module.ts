// src/password-reset/password-reset.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';
import { MailModule } from 'src/mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetToken]),
    forwardRef(() => AuthModule), 
    MailModule,
    JwtModule,
  ],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}