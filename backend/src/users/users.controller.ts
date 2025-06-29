import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './services/users.service';
import { Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayloadUser } from 'src/auth/interfaces/jwt-payload-user.interface';
import { Roles } from 'src/roles-permission/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.user; // contiene { userId, email } si el token fue válido
  }

  // @Get(':id/rol')
  // async getUserRole(@Param('id') id: string) {
  //   const user = await this.usersService.findById(id);
  //   if (!user) throw new NotFoundException('Usuario no encontrado');
  //   // Si user.roles es array
  //   return { roles: user.roles.map((role) => role.name) };
  //   // Si solo tiene uno: return { role: user.role.name }
  // }

  // @Patch(':id/rol')
  // async updateUserRole(
  //   @Param('id') id: string,
  //   @Body() body: UpdateUserRoleDto,
  // ) {
  //   return this.usersService.updateUserRole(id, body.roleIds);
  // }

  // // Endpoint de prueba solo para administradores
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'comisionista')
  // @Get('admin-only')
  // getOnlyAdmins(@Req() req) {
  //   console.log('Usuario autenticado:', req.user);
  //   return { message: 'Solo admins/comisionistas pueden ver esto' };
  // }
  // Endpoint de prueba solo para administradores

  // @Get(':id/rol')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin') // Solo admin puede ver roles de otros usuarios
  // async getUserRoles(@Param('id') id: string) {
  //   const user = await this.usersService.findById(id);
  //   if (!user) throw new NotFoundException('Usuario no encontrado');
  //   return {
  //     identity_document: user.identity_document,
  //     roles: user.roles.map((r) => r.name),
  //   };
  // }

  // @Patch(':id/rol')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin') // Solo admin puede asignar roles
  // async updateUserRole(
  //   @Param('id') id: string,
  //   @Body() body: UpdateUserRoleDto,
  // ) {
  //   return this.usersService.updateUserRole(id, body.roleIds);
  // }
  @Get('perfilCompleto')
  @UseGuards(JwtAuthGuard)
  async getProfileCompleto(@Req() req: Request) {
    const { userId } = req.user as JwtPayloadUser;
    //console.log('identity_document extraído:', userId);
    return this.usersService.getProfileCompleto(userId);
  }

  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const { userId } = req.user as JwtPayloadUser;
    return this.usersService.updateProfile(userId, body);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminUpdateUserProfile(
    @Param('userId') userId: string,
    @Body() body: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(userId, body);
    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return { message: 'Usuario actualizado', user: updated };
  }

  //users.controller.ts
  // @Patch('perfil/password')
  // @UseGuards(JwtAuthGuard)
  // async changePassword(
  //   @Req() req: Request,
  //   @Body() body: ChangePasswordDto,
  // ): Promise<{ message: string }> {
  //   // Tipar explícitamente el usuario inyectado por JwtStrategy
  //   const user = req.user as { userId: string };
  //   // Usa await para el método asíncrono
  //   return await this.authService.changePassword(user.userId, body);
  // }
}
