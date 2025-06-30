import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AccountsService } from 'src/accounts/services/accounts.service';;
import { Account } from 'src/accounts/entities/account.entity';
import { OrdersService } from './providers/orders.service';
import { OrderDto } from './dto/order.dto';
import { OrderUpdateDto } from './dto/order-update.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('')
  async createOrder(@Body() orderDto: OrderDto, @Request() req){
      return this.ordersService.createOrder(orderDto, req.user.sub)
  }
}
