import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  accountId: number;
}