import { Injectable, HttpException, HttpStatus, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SellOrderDto } from '../dto/sell-stock.dto';
import { OrderDto } from '../dto/order.dto';
import { FactoryOrder } from './factory-order.provider';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { plainToInstance } from 'class-transformer';
import { typeOrder } from '../enums/type-order.enum';
import { SharesService } from 'src/shares/services/shares.service';
import { Account } from 'src/accounts/entities/account.entity';
import { Repository } from 'typeorm';
import { Order } from '../entities/orders.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Commission } from '../entities/comissions.entity';


@Injectable()
export class OrdersService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly factoryOrder: FactoryOrder,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountsService: AccountsService,
    private readonly sharesService: SharesService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>
  ) { }


  async createOrder(orderDto: OrderDto, account_id: number) {
    const share =await this.sharesService.findOneBySymbol(orderDto.symbol)
    const account = await this.accountsService.checkExistenceAccount(undefined, account_id)
    if (!account){
      throw new BadRequestException('Cuenta no encontrada')
    }
    orderDto = {
      ...orderDto,
       account: account,
       share: share
    }
    orderDto.account = account
    return this.factoryOrder.create(orderDto)
  }
  async listOrderAccount(account: Account){
    const orders = await this.orderRepository.find({
      where: {account: {id: account.id}},
      relations: ['commissions']
    })
    return orders
  }
}
