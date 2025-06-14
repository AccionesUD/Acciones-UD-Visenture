import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { ROLES_KEY } from 'src/roles-permission/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const { user } = request;
    const userRoles = Array.isArray(user.roles)
      ? user.roles
          .map((r): string => {
            if (typeof r === 'string') {
              return r;
            } else if (
              r &&
              typeof r === 'object' &&
              typeof (r as { name?: unknown }).name === 'string'
            ) {
              return (r as { name: string }).name;
            }
            return '';
          })
          .filter((role) => role !== '')
      : [];
    const hasRole = userRoles.some((role) => requiredRoles.includes(role));
    console.log(
      'Roles del usuario:',
      userRoles,
      'Roles requeridos:',
      requiredRoles,
      '¿Acceso?',
      hasRole,
    );
    return hasRole;
  }
}
