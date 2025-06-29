import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

// src/price-alerts/dto/create-price-alert.dto.ts
export class CreatePriceAlertDto {
  @IsString()
  share_id: string;

  @IsNumber()
  target_price: number;

  @IsIn(['above', 'below'])
  direction: 'above' | 'below';

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;
}