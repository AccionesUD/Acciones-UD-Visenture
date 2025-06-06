import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from '../assets.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  // Busca si el accountId tiene al menos la cantidad requerida de acciones del symbol
  async hasEnoughShares(
    accountId: number,
    symbol: string,
    quantity: number,
  ): Promise<boolean> {
    const asset = await this.assetRepository.findOne({
      where: {
        account: { id: accountId },
        symbol: symbol,
      },
      relations: ['account'],
    });
    return asset ? asset.currentShareQuantity >= quantity : false;
  }
}
