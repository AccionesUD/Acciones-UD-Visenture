import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RolePermissionsSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async onApplicationBootstrap() {
    // Permisos premium
    const premiumPerms = [
      'access_extended_hours',
      'view_premium_reports',
      'access_premium_charts',
      'manage_watchlist',
    ];

    // Permisos auditor
    const auditorPerms = ['view_reports', 'view_audit_logs'];

    // Permisos básicos usuario
    const userPerms = [
      'view_market_data',
      'create_order',
      'cancel_order',
      'view_own_orders',
      'enqueue_off_hours_order',
      'view_assigned_portfolio',
      'manage_profile',
      'manage_notification_preferences',
    ];

    // Comisionista = usuario + estos adicionales
    const comisionistaExtras = ['manage_users', 'view_reports'];

    // Admin = todos los permisos
    const allPerms = await this.permRepo.find();

    // 1. Asociar permisos a usuario
    const usuario = await this.roleRepo.findOne({
      where: { name: 'usuario' },
      relations: ['permissions'],
    });
    if (usuario) {
      usuario.permissions = await this.permRepo.findBy({ name: In(userPerms) });
      await this.roleRepo.save(usuario);
    }

    // 2. usuario_premium solo permisos premium
    const usuarioPremium = await this.roleRepo.findOne({
      where: { name: 'usuario_premium' },
      relations: ['permissions'],
    });
    if (usuarioPremium) {
      usuarioPremium.permissions = await this.permRepo.findBy({
        name: In(premiumPerms),
      });
      await this.roleRepo.save(usuarioPremium);
    }

    // 3. Comisionista = usuario + extras
    const comisionista = await this.roleRepo.findOne({
      where: { name: 'comisionista' },
      relations: ['permissions'],
    });
    if (comisionista) {
      comisionista.permissions = await this.permRepo.findBy({
        name: In([...userPerms, ...comisionistaExtras]),
      });
      await this.roleRepo.save(comisionista);
    }

    // 4. Admin = todos
    const admin = await this.roleRepo.findOne({
      where: { name: 'admin' },
      relations: ['permissions'],
    });
    if (admin) {
      admin.permissions = allPerms;
      await this.roleRepo.save(admin);
    }

    // 5. Auditor = solo especiales
    const auditor = await this.roleRepo.findOne({
      where: { name: 'auditor' },
      relations: ['permissions'],
    });
    if (auditor) {
      auditor.permissions = await this.permRepo.findBy({
        name: In(auditorPerms),
      });
      await this.roleRepo.save(auditor);
    }

    console.log('Permisos asignados correctamente a cada rol');
  }
}
