// src/shares/services/services.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Share } from '../entities/shares.entity';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { CreateShareDto } from '../dto/create-share.dto';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(Share)
    private readonly shareRepo: Repository<Share>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  async createShare(dto: CreateShareDto): Promise<Share> {
    // Validar que el mercado exista
    const stock = await this.stockRepo.findOne({
      where: { mic: dto.mic_stock_market },
    });
    if (!stock) {
      throw new BadRequestException(
        `El mercado ${dto.mic_stock_market} no existe.`,
      );
    }
    // Crear y guardar la acción (Share) asociada al mercado (Stock)
    const share = this.shareRepo.create({
      ...dto,
      stock, // relación
    });
    return this.shareRepo.save(share);
  }
}
