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
    const requiredMics = [
      { mic: 'XNYS', key: 'N', name: 'New York Stock Exchange' }, // NYSE
      { mic: 'XNAS', key: 'Q', name: 'NASDAQ OMX' }, // NASDAQ
    ];

    // 1. Buscar los que ya existen en la BD
    const existentes = await this.stockRepo.find({
      where: requiredMics.map((m) => ({ mic: m.mic })),
      select: ['mic'],
    });
    const existentesMics = existentes.map((x) => x.mic);

    const faltan = requiredMics.filter((m) => !existentesMics.includes(m.mic));
    if (faltan.length === 0) {
      return { message: 'Los mercados NYSE y NASDAQ ya existen', creados: [] };
    }

    // 2. Consultar la API Market Data Alpaca
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

    // 3. Verificar y registrar solo los faltantes que estén en Alpaca
    const registrosCreados: Stock[] = [];
    for (const falta of faltan) {
      if (alpacaData[falta.key] && alpacaData[falta.key].includes(falta.name)) {
        const nuevo = this.stockRepo.create({
          mic: falta.mic,
          name_market: alpacaData[falta.key], // Usa el nombre completo retornado
          country_region: '', // (Agrega si puedes inferirlo)
          logo: '',
          opening_time: '',
          closing_time: '',
          days_operation: '',
        });
        await this.stockRepo.save(nuevo);
        registrosCreados.push(nuevo);
      }
    }

    return {
      message: 'Proceso completado',
      creados: registrosCreados,
      faltaban: faltan.map((x) => x.mic),
    };
  }
}
