// src/roles-permission/services/roles-seed.service.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async onApplicationBootstrap() {
    const roles = [
      { name: 'usuario', description: 'Rol de usuario estándar' },
      { name: 'comisionista', description: 'Rol de comisionista' },
      { name: 'admin', description: 'Rol de administrador' },
      {
        name: 'auditor',
        description: 'Rol de auditor (supervisión y revisión)',
      },
      {
        name: 'usuario_premium',
        description: 'Usuario con suscripción premium',
      },
    ];

    for (const rol of roles) {
      const existe = await this.roleRepo.findOne({ where: { name: rol.name } });
      if (!existe) {
        await this.roleRepo.save(rol);
      }
    }
    console.log(
      'Roles básicos inicializados (usuario, comisionista, admin, auditor, usuario_premium)',
    );
  }
}
