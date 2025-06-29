import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "src/advisor/dto/auth-request.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SettingNotification } from "./entities/setting-notification.entity";
import { PreferencesService } from "./preferences.service";
import { SettingMailing } from "./entities/setting-mailing.entity";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";



@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
    constructor(private readonly preferencesService: PreferencesService) { }

    @Get('notifications-settings')
    async getNotificationsSettings(@Req() req: AuthenticatedRequest) {
        return this.preferencesService.getNotificationsSettings(req.user.accountId);
    }

    @Patch('notifications-settings')
    async updateNotificationsSettings(
        @Req() req: AuthenticatedRequest,
        @Body() updateDto: Partial<SettingNotification>
    ) {
        return this.preferencesService.updateNotificationsSettings(
            req.user.accountId, 
            updateDto
        );
    }

      @Get('mailing-settings')
      @ApiOperation({ summary: 'Obtener configuración de mailing del usuario actual' })
      @ApiResponse({
        status: 200,
        description: 'Configuración de notificaciones',
        type: SettingMailing
      })
      @ApiResponse({ status: 401, description: 'No autorizado' })
      async getSettings(@Req() req: AuthenticatedRequest) {
        // El guard JWT añade el usuario autenticado a la solicitud
        return this.preferencesService.getMailingSettings(req.user.accountId);
      }

      @Patch('mailing-settings')
      @ApiOperation({ summary: 'Actualizar configuración de mailing' })
      @ApiResponse({
        status: 200,
        description: 'Configuración actualizada',
        type: SettingMailing
      })
      @ApiResponse({ status: 400, description: 'Datos inválidos' })
      @ApiResponse({ status: 401, description: 'No autorizado' })
      async updateSettings(
        @Req() req: AuthenticatedRequest,
        @Body() updateDto: Partial<SettingMailing>
      ) {
        return this.preferencesService.updateMailingSettings(
          req.user.accountId,
          updateDto
        );
      }
}