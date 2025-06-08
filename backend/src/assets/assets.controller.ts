import { Controller, Get, Query, UseGuards, Request, Post, UsePipes, ValidationPipe, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AssetsService } from './services/assets.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AlpacaAsset } from './dto/alpaca-asset.dto';
import { Asset } from './assets.entity';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly accountsService: AccountsService,
  ) { }

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

  @Post('new')
  @ApiOperation({ summary: 'Registrar un nuevo Asset' })
  @ApiResponse({
    status: 201,
    description: 'Asset successfully registered',
    type: AlpacaAsset
  })
  @ApiResponse({ status: 400, description: 'Entrada invalida o el activo ya existe' })
  @ApiResponse({ status: 404, description: 'Mercado no encontrado' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createAssetDto: CreateAssetDto): Promise<AlpacaAsset> {
    const asset = await this.assetsService.create(createAssetDto, createAssetDto.accountId);
    return await this.assetsService.mapToDto(asset);
  }

  @Get('all')
  @ApiOperation({ summary: 'Lista todos los assets' })
  @ApiResponse({
    status: 200,
    description: 'List of all assets',
    type: [AlpacaAsset]
  })
  async findAll(): Promise<AlpacaAsset[]> {
    const assets = await this.assetsService.findAll();
    return assets.map(asset => this.assetsService.mapToDto(asset));
  }

  @Get('search')
  @ApiOperation({ summary: 'Encuentra un asset con el simbolo' })
  @ApiQuery({ name: 'symbol', required: true, example: 'AAPL' })
  @ApiResponse({
    status: 200,
    description: 'Asset details',
    type: AlpacaAsset
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Query('symbol') symbol: string): Promise<AlpacaAsset> {
    const asset = await this.assetsService.findOneBySymbol(symbol);
    return this.assetsService.mapToDto(asset);
  }
}