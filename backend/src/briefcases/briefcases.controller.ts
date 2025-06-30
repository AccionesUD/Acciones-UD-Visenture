import { ClassSerializerInterceptor, Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BriefcaseService } from './services/briefcases.service';

@Controller('briefcase')
export class BriefcaseController {
    constructor(
        private readonly briefcaseService: BriefcaseService
    ){}

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(JwtAuthGuard)
    @Get('')
    async getBriefcase(@Req() req){
        return this.briefcaseService.getBriefcaseAssets(req.user.sub)
    }
    
}
