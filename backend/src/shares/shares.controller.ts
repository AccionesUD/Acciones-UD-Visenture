// src/shares/share.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SharesService } from './services/service.service';
import { CreateShareDto } from './dto/create-share.dto';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  async createShare(@Body() dto: CreateShareDto) {
    return this.sharesService.createShare(dto);
  }
}
