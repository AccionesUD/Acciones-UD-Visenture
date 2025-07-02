import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async onApplicationBootstrap() {
    const permisos = [
      { name: 'view_market_data', description: 'Ver datos del mercado' },
      { name: 'create_order', description: 'Crear órdenes' },
      { name: 'cancel_order', description: 'Cancelar órdenes' },
      { name: 'view_own_orders', description: 'Ver mis órdenes' },
      {
        name: 'enqueue_off_hours_order',
        description: 'Encolar órdenes fuera de horario',
      },
      {
        name: 'access_extended_hours',
        description: 'Acceso a horarios extendidos',
      },
      {
        name: 'view_assigned_portfolio',
        description: 'Ver portafolio asignado',
      },
      { name: 'manage_profile', description: 'Gestionar perfil' },
      {
        name: 'manage_notification_preferences',
        description: 'Gestionar preferencias de notificación',
      },
      {
        name: 'manage_watchlist',
        description: 'Gestionar lista de seguimiento',
      },
      { name: 'view_premium_reports', description: 'Ver reportes premium' },
      {
        name: 'access_premium_charts',
        description: 'Acceso a gráficos premium',
      },
      { name: 'manage_users', description: 'Gestionar usuarios' },
      { name: 'assign_roles', description: 'Asignar roles' },
      { name: 'manage_roles', description: 'Gestionar roles' },
      { name: 'manage_permissions', description: 'Gestionar permisos' },
      { name: 'view_reports', description: 'Ver reportes generales' },
      { name: 'view_audit_logs', description: 'Ver logs de auditoría' },
      { name: 'manage_markets', description: 'Gestionar mercados' },
      {
        name: 'manage_subscriptions',
        description: 'Gestionar suscripciones premium',
      },
    ];

    for (const permiso of permisos) {
      const existe = await this.permissionRepo.findOne({
        where: { name: permiso.name },
      });
      if (!existe) {
        await this.permissionRepo.save(permiso);
      }
    }
    console.log('Permisos iniciales insertados.');
  }
}
