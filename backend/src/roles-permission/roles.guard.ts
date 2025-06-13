import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true; // si no hay roles requeridos, permite acceso

    interface RequestUser {
      roles: string[] | string;
      [key: string]: any;
    }
    interface TypedRequest extends Request {
      user?: RequestUser;
    }
    const request = context.switchToHttp().getRequest<TypedRequest>();
    const user = request.user as RequestUser;
    if (!user?.roles) {
      throw new ForbiddenException('No roles assigned to user.');
    }
    // Aquí user.roles debe ser array de strings
    const userRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
      : [user?.roles];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: se requieren los roles [${requiredRoles.join(
          ', ',
        )}], pero el usuario tiene: [${userRoles?.join(', ') || 'ninguno'}]`,
      );
    }
    return true;
  }
}
