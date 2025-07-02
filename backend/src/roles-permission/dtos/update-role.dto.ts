import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  permissions?: number[]; // IDs de permisos actualizados
}
