import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiProperty({
    required: false,
    description: 'Habilitar notificaciones por email'
  })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({
    required: false,
    description: 'Habilitar notificaciones por SMS'
  })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiProperty({
    required: false,
    description: 'Habilitar notificaciones por WhatsApp'
  })
  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @ApiProperty({
    required: false,
    description: 'Número de teléfono para SMS/WhatsApp'
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}