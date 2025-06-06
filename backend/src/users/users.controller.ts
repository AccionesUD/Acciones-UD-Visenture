import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './services/users.service';
import { Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
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
}
