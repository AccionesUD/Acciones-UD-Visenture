// src/auth/dto/validate-token.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class ValidateTokenDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;
}
