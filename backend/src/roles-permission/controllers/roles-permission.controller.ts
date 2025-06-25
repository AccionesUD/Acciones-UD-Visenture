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

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RolesPermissionController {
  constructor(
    private readonly rolesPermissionService: RolesPermissionService,
  ) {}

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
}
