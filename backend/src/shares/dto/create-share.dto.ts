// src/shares/dto/create-share.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShareDto {
  @ApiProperty({ example: 'AAPL', description: 'Símbolo de la acción' })
  @IsNotEmpty()
  @IsString()
  symbol: string;
}