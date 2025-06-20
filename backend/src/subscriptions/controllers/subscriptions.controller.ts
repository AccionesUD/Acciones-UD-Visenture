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
  getMe(@Req() req) {
    return req.user;
  }
}
