import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { SellOrderDto } from './dto/sell-stock.dto';
import { Account } from 'src/accounts/entities/account.entity';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly accountsService: AccountsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('sell')
  async sellStock(
    @Body() sellOrderDto: SellOrderDto,
    @Request() req: { user: { userId: number } },
  ) {
    // 1. Buscar la cuenta de Alpaca asociada al usuario
    const account: Account | null = await this.accountsService.findByUserId(
      Number(req.user.userId), // <-- Aquí convierte a número
    );

    if (!account?.alpaca_account_id) {
      throw new BadRequestException(
        'No se encontró la cuenta de Alpaca asociada',
      );
    }

    // 2. Ejecutar la orden (errores serán lanzados por el servicio)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const order = await this.ordersService.placeSellOrder(
      account.alpaca_account_id,
      sellOrderDto,
    );

    return {
      message: 'Orden de venta ejecutada exitosamente',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      order,
    };
  }
}
