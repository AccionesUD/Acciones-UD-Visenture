// src/shares/dto/create-share.dto.ts
import { IsString, IsBoolean } from 'class-validator';

export class CreateShareDto {
  @IsString()
  class: string;

  @IsString()
  ticker: string;

  @IsString()
  name_share: string;

  @IsString()
  sector: string;

  @IsBoolean()
  status: boolean;

  @IsBoolean()
  tradable: boolean;

  @IsString()
  mic_stock_market: string; // mic del mercado asociado
}
