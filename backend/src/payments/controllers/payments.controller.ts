import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CrearPreferenciaDto } from '../dtos/crear-preferencia.dto';
import { SubscribeDto } from 'src/subscriptions/dtos/subscribe.dto';
import { JwtPayloadUser } from 'src/auth/interfaces/jwt-payload-user.interface';
import { SubscriptionsService } from 'src/subscriptions/services/subscriptions.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  [x: string]: any;
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  //Este llama a la pasarela de pago y ejecuta el pago
  @Post('crear-preferencia')
  crearPreferencia(@Body() dto: CrearPreferenciaDto) {
    return this.paymentsService.crearPreferencia(dto);
  }

  //Endpoint que asigna rol premium a un usuario normal
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @Req() req: Request & { user?: JwtPayloadUser },
    @Body() dto: SubscribeDto,
  ): Promise<{ message: string; plan: string }> {
    const accountId = req.user?.sub;
    if (!accountId) {
      throw new UnauthorizedException('No autenticado');
    }

    // 🔥 Aquí estamos “asumiendo” que dto.paymentToken ya es válido,
    //    así que saltamos la validación real con Mercado Pago.

    return this.subscriptionsService.subscribeToPremium(accountId, dto.planId);
  }
}
