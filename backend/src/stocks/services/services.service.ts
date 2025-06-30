import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Stock } from '../entities/stocks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment-timezone';

@Injectable()
export class ServicesService {
  private readonly MARKET_STATUS_CACHE_PREFIX = 'market_status_';
  private readonly MARKET_HOURS_CACHE_PREFIX = 'market_hours_';
  private readonly CACHE_TTL = 60 * 5; // 5 minutes

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  async inicializarMercados(): Promise<any> {
    // MICs requeridos y nombres exactos según la API de Alpaca
    const mercados = [
      { mic: 'XNYS', nombre: 'New York Stock Exchange' },
      { mic: 'XNAS', nombre: 'NASDAQ OMX' },
    ];

    // 1. Consultar la API Market Data Alpaca
    const url = 'https://data.alpaca.markets/v2/stocks/meta/exchanges';
    const apiKey = this.configService.get<string>('ALPACA_API_KEY');
    const apiSecret = this.configService.get<string>('ALPACA_SECRET_KEY');
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    };

    let alpacaData: Record<string, string>;
    try {
      const response$ = this.httpService.get(url, { headers });
      const { data } = await firstValueFrom(response$);
      alpacaData = data;
    } catch (error) {
      throw new Error('No se pudo consultar la API de mercados de Alpaca');
    }

    // Enriquecimiento de datos adicionales
    const logosMap: Record<string, string> = {
      XNYS: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/NYSE_Logo.svg',
      XNAS: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/NASDAQ_Logo.svg',
    };
    const countriesMap: Record<string, string> = {
      XNYS: 'Estados Unidos',
      XNAS: 'Estados Unidos',
    };
    const openingTime = '09:30';
    const closingTime = '16:00';
    const daysOperation = 'Lunes a Viernes';

    // 2. Procesar mercados requeridos
    const resultado: { creado_o_actualizado: string[]; errores: string[] } = {
      creado_o_actualizado: [],
      errores: [],
    };

    for (const mercado of mercados) {
      // Buscar el nombre exacto en la respuesta de Alpaca
      const entry = Object.entries(alpacaData).find(
        ([, nombreApi]) => nombreApi === mercado.nombre,
      );

      if (!entry) {
        resultado.errores.push(`${mercado.mic} no existe en Alpaca`);
        continue;
      }

      // Usamos los valores tal cual del mapping
      const existente = await this.stockRepo.findOne({
        where: { mic: mercado.mic },
      });
      const dataActualizar = {
        mic: mercado.mic,
        name_market: mercado.nombre,
        country_region: countriesMap[mercado.mic],
        logo: logosMap[mercado.mic],
        opening_time: openingTime,
        closing_time: closingTime,
        days_operation: daysOperation,
      };

      if (existente) {
        await this.stockRepo.update({ mic: mercado.mic }, dataActualizar);
        resultado.creado_o_actualizado.push(`${mercado.mic} actualizado`);
      } else {
        const nuevo = this.stockRepo.create(dataActualizar);
        await this.stockRepo.save(nuevo);
        resultado.creado_o_actualizado.push(`${mercado.mic} creado`);
      }
    }

    return {
      message: 'Proceso completado',
      ...resultado,
    };
  }

  async findAll(): Promise<Stock[]> {
    return this.stockRepo.find();
  }

  async isMarketOpen(mic: string): Promise<boolean> {
    const cacheKey = `${this.MARKET_STATUS_CACHE_PREFIX}${mic}`;
    
    try {
      // Intentar obtener del caché primero
      const cachedStatus = await this.cacheManager.get<boolean>(cacheKey);
      if (cachedStatus !== undefined && cachedStatus !== null) {
        return Boolean(cachedStatus);
      }

      // Obtener datos del mercado
      const market = await this.getMarketWithCache(mic);
      if (!market) {
        return false;
      }

      // Calcular estado del mercado
      const isOpen = this.calculateMarketStatus(market);

      // Almacenar en caché
      await this.cacheManager.set(cacheKey, isOpen, this.CACHE_TTL);
      
      return isOpen;
    } catch (error) {
      console.error(`Error checking market status for ${mic}:`, error);
      return false;
    }
  }

  async getMarketTradingHours(mic: string): Promise<Stock | null> {
    const cacheKey = `${this.MARKET_HOURS_CACHE_PREFIX}${mic}`;
    
    try {
      // Intentar obtener del caché primero
      const cachedHours = await this.cacheManager.get<Stock>(cacheKey);
      if (cachedHours) {
        return cachedHours;
      }

      // Obtener de la base de datos
      const market = await this.stockRepo.findOneBy({ mic });
      if (!market) {
        return null;
      }

      // Almacenar en caché
      await this.cacheManager.set(cacheKey, market, this.CACHE_TTL * 24); // Cache más largo para datos estáticos

      return market;
    } catch (error) {
      console.error(`Error getting trading hours for ${mic}:`, error);
      return null;
    }
  }

  private async getMarketWithCache(mic: string): Promise<Stock | null> {
    const cacheKey = `${this.MARKET_HOURS_CACHE_PREFIX}${mic}`;
    const cachedMarket = await this.cacheManager.get<Stock>(cacheKey);
    
    if (cachedMarket) {
      return cachedMarket;
    }

    const market = await this.stockRepo.findOneBy({ mic });
    if (market) {
      await this.cacheManager.set(cacheKey, market, this.CACHE_TTL * 24); // 24 horas para datos estáticos
    }
    
    return market;
  }

  private calculateMarketStatus(market: Stock): boolean {
  try {
    // Verificar que moment está correctamente importado
    if (!moment || typeof moment.tz !== 'function') {
      throw new Error('moment-timezone no está correctamente configurado');
    }

    const timezone = 'America/New_York';
    const now = moment().tz(timezone);
    
    if (!now.isValid()) {
      throw new Error('Fecha/hora inválida');
    }

    const currentDay = now.format('dddd').toLowerCase();
    const currentTime = now.format('HH:mm');

    if (!market.days_operation.toLowerCase().includes(currentDay)) {
      return false;
    }

    return currentTime >= market.opening_time && currentTime <= market.closing_time;
  } catch (error) {
    console.error('Error calculando estado del mercado:', error);
    return false;
  }
}
  // Método para limpiar caché manualmente si es necesario
  async clearMarketCache(mic: string): Promise<void> {
    const statusKey = `${this.MARKET_STATUS_CACHE_PREFIX}${mic}`;
    const hoursKey = `${this.MARKET_HOURS_CACHE_PREFIX}${mic}`;
    await this.cacheManager.del(statusKey);
    await this.cacheManager.del(hoursKey);
  }
}
