import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SellOrderDto } from '../dto/sell-stock.dto';
import { OrderDto } from '../dto/order.dto';
import { FactoryOrder } from './factory-order.provider';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { plainToInstance } from 'class-transformer';
import { LimitOrderDto, MarketOrdeDto, StopOrderDto } from '../dto/orderClean.dto';
import { typeOrder } from '../enums/type-order.enum';


@Injectable()
export class OrdersService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly factoryOrder: FactoryOrder,
    private readonly accountsService: AccountsService
  ) {}


  async createOrder(orderDto: OrderDto, account_id: number){
    orderDto.account = account_id
    let orderCleanDto 
    switch (orderDto.type) {
      case (typeOrder.LIMIT):
        orderCleanDto = plainToInstance(LimitOrderDto, orderDto, {excludeExtraneousValues: true})
        break
      case (typeOrder.MARKET):
        orderCleanDto = plainToInstance(MarketOrdeDto, orderDto, {excludeExtraneousValues: true})
        break
      case (typeOrder.STOP):
        orderCleanDto = plainToInstance(StopOrderDto, orderDto, {excludeExtraneousValues: true})
        break
    }
   return this.factoryOrder.create(orderCleanDto)
    
  }

  async placeSellOrder(
    alpacaAccountId: string,
    dto: SellOrderDto,
  ): Promise<any> {
    const url = `https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${alpacaAccountId}/orders`;
    const headers = {
      'APCA-API-KEY-ID': this.configService.get<string>(
        'ALPACA_BROKER_API_KEY',
      ),
      'APCA-API-SECRET-KEY': this.configService.get<string>(
        'ALPACA_BROKER_SECRE_KEY',
      ),
    };

    const orderBody: Record<string, unknown> = {
      symbol: dto.symbol,
      qty: dto.quantity,
      side: 'sell',
      type: dto.type,
      time_in_force: dto.time_in_force,
    };

    if (dto.limit_price !== undefined) orderBody.limit_price = dto.limit_price;
    if (dto.stop_price !== undefined) orderBody.stop_price = dto.stop_price;

    try {
      const response$ = this.httpService.post<any, Record<string, unknown>>(
        url,
        orderBody,
        { headers },
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (err: unknown) {
      // Tipado seguro para errores de Axios
      let errorData: unknown = 'Error placing sell order';
      let statusCode: number = HttpStatus.BAD_REQUEST;

      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof (err as any).response === 'object'
      ) {
        const response = (
          err as { response: { data?: unknown; status?: number } }
        ).response;
        if ('data' in response) errorData = response.data ?? errorData;
        if ('status' in response) statusCode = response.status ?? statusCode;
      }

      throw new HttpException(
        typeof errorData === 'string' ||
        (typeof errorData === 'object' && errorData !== null)
          ? errorData
          : String(errorData),
        statusCode,
      );
    }
  }
}
