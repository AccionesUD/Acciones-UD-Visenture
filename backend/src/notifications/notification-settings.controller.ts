import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../advisor/dto/auth-request.dto';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationSettings } from './entities/notifications-settings.entity';

@ApiTags('Notification Settings')
@ApiBearerAuth()
@Controller('notification-settings')
export class NotificationSettingsController {
  constructor(
    private readonly settingsService: NotificationSettingsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener configuración de notificaciones del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de notificaciones',
    type: NotificationSettings
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getSettings(@Request() req: AuthenticatedRequest) {
    // El guard JWT añade el usuario autenticado a la solicitud
    return this.settingsService.getSettings(req.user.accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ summary: 'Actualizar configuración de notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada',
    type: NotificationSettings
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateNotificationSettingsDto
  ) {
    return this.settingsService.updateSettings(
      req.user.accountId,
      updateDto
    );
  }
}