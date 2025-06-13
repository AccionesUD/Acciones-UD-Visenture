import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './services/users.service';
import { Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserRoleDto } from './dtos/update-user-role.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/roles-permission/roles.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // Santiago: Este endpoint es para obtener el perfil del usuario autenticado es para luego tener seguridad
  // Si puedes ve investigando el decorador @UseGuards
  // El token JWT se envía en el header Authorization como Bearer token
  // El guardia JwtAuthGuard se encarga de validar el token
  // y de inyectar el objeto { userId, email } en req.user
  // Si el token no es válido, el guardia lanzará un error 401
  // Si el token es válido, req.user contendrá el objeto { userId, email }
  // que se generó al firmar el token en el login
  // El decorador @UseGuards(JwtAuthGuard) se encarga de aplicar el guardia
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.user; // contiene { userId, email } si el token fue válido
  }

  @Get(':id/rol')
  async getUserRole(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    // Si user.roles es array
    return { roles: user.roles.map((role) => role.name) };
    // Si solo tiene uno: return { role: user.role.name }
  }

  // @Patch(':id/rol')
  // async updateUserRole(
  //   @Param('id') id: string,
  //   @Body() body: UpdateUserRoleDto,
  // ) {
  //   return this.usersService.updateUserRole(id, body.roleIds);
  // }

  // Endpoint de prueba solo para administradores
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'comisionista')
  @Get('admin-only')
  getOnlyAdmins(@Req() req) {
    console.log('Usuario autenticado:', req.user);
    return { message: 'Solo admins/comisionistas pueden ver esto' };
  }

  @Get(':id/rol')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Solo admin puede ver roles de otros usuarios
  async getUserRoles(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      identity_document: user.identity_document,
      roles: user.roles.map((r) => r.name),
    };
  }

  @Patch(':id/rol')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Solo admin puede asignar roles
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, body.roleIds);
  }

  @Get('perfilCompleto')
  @UseGuards(JwtAuthGuard)
  async getProfileCompleto(@Req() req: Request & { user: AuthUser }) {
    const identity_document: string = String(req.user.userId);
    return this.usersService.getProfileCompleto(identity_document);
  }
}
