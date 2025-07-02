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
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const { user } = request;
    console.log('user:', user);
    console.log('roles:', user.roles);

    // Mapeo seguro a string
    const userRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
          .map((r) => (typeof r === 'string' ? r : r.name))
          .filter((name): name is string => typeof name === 'string')
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
