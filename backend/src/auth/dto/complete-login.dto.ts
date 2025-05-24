// src/auth/dto/complete-login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class CompleteLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;
}
