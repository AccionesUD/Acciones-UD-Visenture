// src/accounts/dtos/update-user-by-admin.dto.ts
import { IsString, IsEmail, IsArray, IsOptional, IsInt } from 'class-validator';

export class UpdateUserByAdminDto {
  @IsInt()
  accountId: number;

  @IsString()
  @IsOptional()
  userId?: string; // identity_document

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsOptional()
  roles?: string[]; // nombres de roles
}
