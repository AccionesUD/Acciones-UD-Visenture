import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { RolesPermissionService } from '../services/roles-permission.service';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/roles-permission/roles.decorator';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dtos/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/update-permission.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RolesPermissionController {
  constructor(
    private readonly rolesPermissionService: RolesPermissionService,
  ) {}

  // ----------- CRUD Permisos (rutas más específicas primero) -----------

  // Crear permiso
  @Post('permissions')
  async createPermission(
    @Body() dto: CreatePermissionDto,
  ): Promise<Permission> {
    return await this.rolesPermissionService.createPermission(dto);
  }

  // Listar todos los permisos
  @Get('permissions')
  async getAllPermissions(): Promise<Permission[]> {
    return await this.rolesPermissionService.findAllPermissions();
  }

  // Obtener detalle de un permiso
  @Get('permissions/:id')
  async getPermission(@Param('id') id: string): Promise<Permission> {
    const permission = await this.rolesPermissionService.findPermissionById(
      Number(id),
    );
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    return permission;
  }

  // Actualizar permiso
  @Patch('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<Permission> {
    return await this.rolesPermissionService.updatePermission(Number(id), dto);
  }

  // Eliminar permiso
  @Delete('permissions/:id')
  async deletePermission(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.rolesPermissionService.deletePermission(Number(id));
    return { message: 'Permiso eliminado correctamente' };
  }

  // ----------- CRUD Roles (rutas generales después) -----------

  // Crear un rol
  @Post()
  async createRole(@Body() dto: CreateRoleDto): Promise<Role> {
    return await this.rolesPermissionService.createRole(dto);
  }

  // Listar todos los roles
  @Get()
  async getAllRoles(): Promise<Role[]> {
    return await this.rolesPermissionService.findAllRoles();
  }

  // Obtener detalle de un rol
  @Get(':id')
  async getRole(@Param('id') id: string): Promise<Role> {
    const role = await this.rolesPermissionService.findRoleById(Number(id));
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  // Actualizar rol
  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<Role> {
    return await this.rolesPermissionService.updateRole(Number(id), dto);
  }

  // Eliminar rol
  @Delete(':id')
  async deleteRole(@Param('id') id: string): Promise<{ message: string }> {
    await this.rolesPermissionService.deleteRole(Number(id));
    return { message: 'Rol eliminado correctamente' };
  }

  // ---------- Asociación rol-permiso ----------

  /**
   * Asignar uno o varios permisos a un rol
   * PATCH /roles/:id/permissions
   * Body: { permissions: number[] }
   */
  @Patch(':id/permissions')
  async assignPermissionsToRole(
    @Param('id') id: string,
    @Body() body: { permissionIds: number[] },
  ): Promise<Role> {
    return await this.rolesPermissionService.assignPermissionsToRole(
      Number(id),
      body.permissionIds,
    );
  }

  /**
   * Listar permisos de un rol
   * GET /roles/:id/permissions
   */
  @Get(':id/permissions')
  async getPermissionsOfRole(@Param('id') id: string): Promise<Permission[]> {
    return await this.rolesPermissionService.getPermissionsOfRole(Number(id));
  }

  /**
   * Quitar un permiso de un rol
   * DELETE /roles/:id/permissions/:permissionId
   */
  @Delete(':id/permissions/:permissionId')
  async removePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ): Promise<{ message: string }> {
    await this.rolesPermissionService.removePermissionFromRole(
      Number(id),
      Number(permissionId),
    );
    return { message: 'Permiso eliminado del rol correctamente' };
  }
}
