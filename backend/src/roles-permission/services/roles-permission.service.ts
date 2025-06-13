import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesPermissionService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async ensureDefaultRoles(): Promise<void> {
    const defaults = [
      { name: 'usuario', description: 'Rol por defecto' },
      { name: 'comisionista', description: 'Puede gestionar clientes' },
      { name: 'administrador', description: 'Administra todo el sistema' },
    ];
    for (const rol of defaults) {
      const existe = await this.roleRepository.findOne({
        where: { name: rol.name },
      });
      if (!existe) {
        await this.roleRepository.save(this.roleRepository.create(rol));
      }
    }
  }
}
