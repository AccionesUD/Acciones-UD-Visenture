import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AccountsService } from 'src/accounts/services/accounts.service';


/*
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly accountsService: AccountsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('validate-shares')
  @UseGuards(JwtAuthGuard)
  @Get('validate-shares')
  async validateShares(
    @Query('symbol') symbol: string,
    @Query('quantity') quantity: string,
    @Request() req: { user: { userId: number } },
  ) {
    const accountId = req.user.userId; // <-- accountId real
    const enough = await this.assetsService.hasEnoughShares(
      accountId,
      symbol,
      Number(quantity),
    );

    return { hasEnoughShares: enough };
  }
}*/
