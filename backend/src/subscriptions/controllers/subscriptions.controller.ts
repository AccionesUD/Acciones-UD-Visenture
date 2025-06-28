import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscribeDto } from '../dtos/subscribe.dto';
import { JwtPayloadUser } from 'src/auth/interfaces/jwt-payload-user.interface';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { Request } from 'express';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @Req() req: Request & { user: JwtPayloadUser },
    @Body() dto: SubscribeDto,
  ): Promise<{ message: string; plan: string }> {
    console.log('Entró a /subscribe', req.user);
    const accountId: number | undefined = req.user?.sub; // <--- CAMBIO AQUÍ
    if (!accountId) throw new UnauthorizedException('No autenticado');
    return await this.subscriptionsService.subscribeToPremium(
      accountId,
      dto.planId,
      dto.paymentToken,
    );
  }

  @Get('me/test-jwt')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    return req.user;
  }

  //Ejemplo de como utilizar el JwtAuthGuard, SubscriptionGuard
  @Get('charts/premium')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  getPremiumCharts(@Req() req: Request & { user: JwtPayloadUser }) {
    return {
      message: '¡Acceso permitido a funcionalidad premium!',
      usuario: req.user, // Ya no hay warning porque tiene tipado explícito
      fecha: new Date(),
    };
  }
}
