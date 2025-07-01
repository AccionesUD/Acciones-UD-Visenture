import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { CreatePermissionDto } from '../dtos/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/update-permission.dto';

@Injectable()
export class RolesPermissionService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
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

  // Crear un rol con posibles permisos asociados
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
    });

    // Si envía permisos, asócialos
    if (dto.permissions && dto.permissions.length > 0) {
      role.permissions = await this.permRepo.findByIds(dto.permissions);
    }

    return await this.roleRepository.save(role);
  }

  // Listar todos los roles
  async findAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({ relations: ['permissions'] });
  }

  // Buscar rol por ID
  async findRoleById(id: number): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  // Actualizar un rol y sus permisos
  async updateRole(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRoleById(id);
    if (!role) throw new NotFoundException('Rol no encontrado');

    if (dto.name) role.name = dto.name;
    if (dto.description) role.description = dto.description;
    if (dto.permissions) {
      role.permissions = await this.permRepo.findByIds(dto.permissions);
    }

    return await this.roleRepository.save(role);
  }

  // Eliminar un rol
  async deleteRole(id: number): Promise<void> {
    const role = await this.findRoleById(id);
    if (!role) throw new NotFoundException('Rol no encontrado');
    await this.roleRepository.remove(role);
  }

  //CRUD Permissions:

  // 1. Crear permiso
  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const permiso = this.permRepo.create(dto);
    return await this.permRepo.save(permiso);
  }

  // 2. Listar todos los permisos
  async findAllPermissions(): Promise<Permission[]> {
    return await this.permRepo.find();
  }

  // 3. Obtener detalle de un permiso
  async findPermissionById(id: number): Promise<Permission | null> {
    return await this.permRepo.findOne({ where: { id } });
  }

  // 4. Actualizar permiso
  async updatePermission(
    id: number,
    dto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permiso = await this.permRepo.findOne({ where: { id } });
    if (!permiso) throw new NotFoundException('Permiso no encontrado');
    Object.assign(permiso, dto);
    return await this.permRepo.save(permiso);
  }

  // 5. Eliminar permiso
  async deletePermission(id: number): Promise<void> {
    const permiso = await this.permRepo.findOne({ where: { id } });
    if (!permiso) throw new NotFoundException('Permiso no encontrado');
    await this.permRepo.remove(permiso);
  }

  //Asociaciones Roles con Permissions

  /**
   * Asigna una lista de permisos a un rol (reemplaza los anteriores)
   */
  async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Rol no encontrado');

    // Obtiene los permisos válidos por sus IDs
    const permissions = await this.permRepo.find({
      where: { id: In(permissionIds) },
    });

    role.permissions = permissions;
    return await this.roleRepository.save(role);
  }

  /**
   * Lista los permisos asociados a un rol
   */
  async getPermissionsOfRole(roleId: number): Promise<Permission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role.permissions;
  }

  /**
   * Elimina un permiso específico de un rol
   */
  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    await this.roleRepository.save(role);
  }
}
