import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from '../assets.entity';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AlpacaTradingService } from 'src/alpaca_trading/alpaca-trading.service';
import { Stock } from 'src/stocks/stocks.entity';
import { AlpacaAsset } from '../dto/alpaca-asset.dto';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly alpacaTradingService: AlpacaTradingService,

  ) { }

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

  async create(createAssetDto: CreateAssetDto, accountId: number): Promise<Asset> {
    const { symbol } = createAssetDto;

    // Verificar si el activo ya existe para esta cuenta
    const existingAsset = await this.assetRepository.findOne({
      where: {
        symbol,
        account: { id: accountId }
      }
    });
    if (existingAsset) {
      throw new Error(`Asset with symbol ${symbol} already exists for this account`);
    }

    // Obtener datos de Alpaca
    const alpacaAsset = await this.alpacaTradingService.getAssetFromAlpaca(symbol);

    // Validar que el activo sea tradable
    if (!alpacaAsset.tradable) {
      throw new Error(`Asset ${symbol} is not tradable`);
    }

    // Validar que pertenezca a NYSE o NASDAQ
    if (!['NYSE', 'NASDAQ'].includes(alpacaAsset.exchange)) {
      throw new Error(`Asset ${symbol} is not from NYSE or NASDAQ`);
    }

    // Obtener el stock correspondiente al mercado
    const stock = await this.stockRepository.findOne({
      where: {
        name_market: alpacaAsset.exchange,
        symbol: alpacaAsset.symbol
      }
    });

    if (!stock) {
      throw new NotFoundException(`Stock for ${symbol} not found`);
    }

    // Crear el nuevo activo con los tipos correctos
    const newAsset = this.assetRepository.create({
      account: { id: accountId },
      symbol: alpacaAsset.symbol,
      name_share: alpacaAsset.name,
      sector: alpacaAsset.sector || null,
      tradable: alpacaAsset.tradable,
      status: alpacaAsset.status,
      currentShareQuantity: 0,
      stock: stock
    });

    return this.assetRepository.save(newAsset);
  }

  public mapToDto(asset: Asset): AlpacaAsset {
    return {
      symbol: asset.symbol,
      name_share: asset.name_share,
      sector: asset.sector || 'Unknown',
      tradable: asset.tradable,
      status: asset.status,
      market: asset.stock.name_market,
      currencySharedQuantitiy: asset.currentShareQuantity
    };
  }

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.find({ relations: ['stock'] });
  }

  // Tarea programada para actualizar activos diariamente
  @Cron(CronExpression.EVERY_MINUTE)
  async updateAssetsStatus() {
    this.logger.log('Starting scheduled assets update...');

    const assets = await this.assetRepository.find();
    for (const asset of assets) {
      try {
        const alpacaAsset = await this.alpacaTradingService.getAssetFromAlpaca(asset.symbol);

        // Actualizar campos relevantes
        asset.tradable = alpacaAsset.tradable;
        asset.status = alpacaAsset.status;
        asset.name_share = alpacaAsset.name;

        await this.assetRepository.save(asset);
        this.logger.log(`Updated asset: ${asset.symbol}`);
      } catch (error) {
        this.logger.error(`Failed to update asset ${asset.symbol}: ${error.message}`);
      }
    }

    this.logger.log('Assets update completed');
  }
  async findOneBySymbol(symbol: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { symbol },
      relations: ['stock']
    });

    if (!asset) {
      throw new NotFoundException(`Asset with symbol ${symbol} not found`);
    }

    return asset;
  }

}
