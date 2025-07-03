import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role } from 'src/roles-permission/entities/role.entity';
import { Roles } from 'src/roles-permission/roles.decorator';
import { RolesGuard } from 'src/roles-permission/roles.guard';
import { AdminAnalyticsService } from './services/admin-analytics/admin-analytics.service';

@Controller('admin-analytics')
export class AdminAnalyticsController {
    constructor(
        private readonly adminAnalyticsService: AdminAnalyticsService
    ){}


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('')
    async getDataAppAnalytics() {
        return this.adminAnalyticsService.getDataAnalytics()
    }
}
