import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "src/advisor/dto/auth-request.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SettingNotification } from "./entities/setting-notification.entity";
import { PreferencesService } from "./preferences.service";



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
        return this.preferencesService.getNotificationsSettings(req.user.accountId, updateDto);
    }
}