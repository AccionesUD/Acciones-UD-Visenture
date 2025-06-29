import { Controller, Body, UseGuards, Req, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../services/subscriptions.service';
import { JwtPayloadUser } from 'src/auth/interfaces/jwt-payload-user.interface';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { Request } from 'express';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
