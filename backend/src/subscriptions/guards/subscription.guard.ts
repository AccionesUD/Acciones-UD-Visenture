import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service';
import { Request } from 'express';
import { JwtPayloadUser } from 'src/auth/interfaces/jwt-payload-user.interface';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtPayloadUser;

    // Tu campo identificador es "sub"
    const accountId = user?.sub;

    if (!accountId) {
      throw new ForbiddenException('No autenticado');
    }

    // Declaramos boolean explícitamente
    const hasActive: boolean =
      await this.subscriptionsService.hasActiveSubscription(accountId);

    if (!hasActive) {
      throw new ForbiddenException(
        'Acceso premium: requiere suscripción activa',
      );
    }

    return true;
  }
}
