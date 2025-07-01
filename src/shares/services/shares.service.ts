// src/shares/services/services.service.ts
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Share } from '../entities/shares.entity';
import { Stock } from 'src/stocks/entities/stocks.entity';
import { AlpacaTradingService } from 'src/alpaca_trading/alpaca-trading.service';
import { CreateShareDto } from '../dto/create-share.dto';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class SharesService {
  private readonly logger = new Logger(SharesService.name);

  constructor(
    @InjectRepository(Share)
    private readonly shareRepository: Repository<Share>,

    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    
    private readonly alpacaTradingService: AlpacaTradingService,
  ) { }

 async create(createShareDto: CreateShareDto): Promise<Share> {
    const { symbol } = createShareDto;

    // Verificar si el share ya existe
    const existingShare = await this.shareRepository.findOne({ 
        where: { symbol } 
    });
    if (existingShare) {
        return existingShare;
    }

    // Obtener datos de Alpaca
    const alpacaAsset = await this.alpacaTradingService.getAssetFromAlpaca(symbol);

    // Validaciones
    if (!alpacaAsset.tradable) {
        throw new BadRequestException(`Asset ${symbol} is not tradable`);
    }

    // Mapeo de exchange a MIC
    const exchangeToMIC = {
        'NASDAQ': 'XNAS',
        'NYSE': 'XNYS',
        'NYSEARCA': 'ARCX',  // Para ETFs
        'NYSEMKT': 'XASE'    // Para AMEX
    };

    const mic = exchangeToMIC[alpacaAsset.exchange];
    if (!mic) {
        throw new BadRequestException(`Unsupported exchange: ${alpacaAsset.exchange}`);
    }

    const stock = await this.stockRepository.findOne({ 
        where: { 
            mic
        } 
    });

    if (!stock) {
        throw new BadRequestException(
            ` ${mic}. Not Found ` +
            `Available exchanges: ${Object.keys(exchangeToMIC).join(', ')}`
        );
    }

    // Crear el nuevo share
    const newShare = this.shareRepository.create({
        symbol: alpacaAsset.symbol,
        name_share: alpacaAsset.name,
        sector: alpacaAsset.sector || null,
        tradable: alpacaAsset.tradable,
        status: alpacaAsset.status,
        stock: stock
    });

    return this.shareRepository.save(newShare);
}

  async findAll(): Promise<Share[]> {
    return this.shareRepository.find({ relations: ['stock'] });
  }

  async findOneBySymbol(symbol: string): Promise<Share> {
    const share = await this.shareRepository.findOne({
      where: { symbol },
      relations: ['stock']
    });

    if (!share) {
      throw new BadRequestException(`Share with symbol ${symbol} not found`);
    }

    return share;
  }

  // Tarea programada para actualizar shares diariamente
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateSharesStatus() {
    this.logger.log('Starting scheduled shares update...');

    const shares = await this.shareRepository.find();
    for (const share of shares) {
      try {
        const alpacaAsset = await this.alpacaTradingService.getAssetFromAlpaca(share.symbol);

        // Actualizar campos relevantes
        share.tradable = alpacaAsset.tradable;
        share.status = alpacaAsset.status;
        share.name_share = alpacaAsset.name;
        share.sector = alpacaAsset.sector || null;

        await this.shareRepository.save(share);
        this.logger.log(`Updated share: ${share.symbol}`);
      } catch (error) {
        this.logger.error(`Failed to update share ${share.symbol}: ${error.message}`);
      }
    }

    this.logger.log('Shares update completed');
  }

  async getAllAlpacaAssets(){
    return this.alpacaTradingService.getAllStocks();
  }
}
// async createShare(dto: CreateShareDto): Promise<Share> {
//   // Validar que el mercado exista
//   const stock = await this.stockRepo.findOne({
//     where: { mic: dto.mic_stock_market },
//   });
//   if (!stock) {
//     throw new BadRequestException(
//       `El mercado ${dto.mic_stock_market} no existe.`,
//     );
//   }
//   // Crear y guardar la acción (Share) asociada al mercado (Stock)
//   const share = this.shareRepo.create({
//     ...dto,
//     stock, // relación
//   });
//   return this.shareRepo.save(share);
// }