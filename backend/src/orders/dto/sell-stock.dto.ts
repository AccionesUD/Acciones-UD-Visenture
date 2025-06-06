import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class SellOrderDto {
  @IsString()
  symbol: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsIn(['market', 'limit', 'stop', 'stop_limit'])
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @IsString()
  @IsIn(['day', 'gtc'])
  time_in_force: 'day' | 'gtc';

  @IsOptional()
  @IsNumber()
  limit_price?: number;

  @IsOptional()
  @IsNumber()
  stop_price?: number;
}
