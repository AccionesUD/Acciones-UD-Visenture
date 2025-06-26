import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MakeFundignAccountDto } from './dtos/make-funding-account.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/roles-permission/roles.decorator';
import { RolesGuard } from 'src/roles-permission/roles.guard';
import { AccountsService } from './services/accounts.service';



@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ) { }

    @Post('/funding')
    async createTransaction(@Body() makeFundignAccountDto: MakeFundignAccountDto, @Req() req) {
        return this.accountsService.fundingAccount(makeFundignAccountDto, req.user.sub)
    }

    @Get('/balance')
    async getBalanceAccount(@Req() req){
        return this.accountsService.getBalanceAccount(req.user.sub)
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get('/orders')
    async getOrdersAccount(@Req() req){
        return this.accountsService.getOrdersAccount(req.user.sub)
    }

    // Endpoint de prueba solo para administradores
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'comisionista')
  @Get('admin-only')
  getOnlyAdmins(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('Usuario autenticado:', req.accountId);
    return { message: 'Solo admins/comisionistas pueden ver esto' };
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAccountRoles(
    @Param('id') id: string,
  ): Promise<{ accountId: number; roles: string[] }> {
    const account = await this.accountsService.findByIdWithRoles(Number(id));
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return {
      accountId: account.id,
      roles: account.roles?.map((r) => r.name) ?? [],
    };
  }

  @Patch(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateAccountRoles(
    @Param('id') id: string,
    @Body() body: { roleIds: number[] },
  ): Promise<{ message: string; roles: string[] }> {
    return await this.accountsService.updateAccountRoles(
      Number(id),
      body.roleIds,
    );
  }
}
