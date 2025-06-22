import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { AdvisorService } from "./advisor.service";
import { AuthenticatedRequest } from "./dto/auth-request.dto";

@Controller('advisor')
@UseGuards(JwtAuthGuard)
export class AdvisorController {
    constructor(private readonly advisorService: AdvisorService) { }

    @Get('certified')
    async getCertifiedAdvisor() {
        return await this.advisorService.getCertifiedAdvisor();
    }

    @Post('assign/:advisorId')
    async assignAdvisor(
        @Req() req: AuthenticatedRequest,
        @Param('advisorId') advisorId: string,
    ) {
        if (!req.user || !req.user.userId) {
            throw new Error('Usuario no autenticado correctamente');
        }
        const userId = req.user.userId;
        return this.advisorService.assignAdvisor(userId, advisorId);
    }

    @Get('my-advisor')
    async getMyAdvisor(@Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return await this.advisorService.getAssignedAdvisor(userId);
    }

    @Delete('unassign')
    async unassignAdvisor(
        @Req() req: AuthenticatedRequest,
    ) {
        if (!req.user || !req.user.userId) {
            throw new HttpException('Usuario no autenticado', HttpStatus.UNAUTHORIZED);
        }
        const userId = req.user.userId;
        return this.advisorService.unassignAdvisor(userId);
    }
}