import { Injectable } from '@nestjs/common';
import { Stock } from '../entities/stocks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

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
}
