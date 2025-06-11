// src/shares/share.controller.ts
import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SharesService } from './services/shares.service';

@ApiTags('shares')
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post('new')
  @ApiOperation({ summary: 'Registrar un nuevo share' })
  @ApiResponse({ 
    status: 201, 
    description: 'Share successfully registered or already exists'
  })
  @ApiResponse({ status: 400, description: 'Invalid input or asset not tradable' })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createShareDto: CreateShareDto) {
    return this.sharesService.create(createShareDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all available shares' })
  @ApiResponse({
    status: 200,
    description: 'List of all shares'
  })
  async findAll() {
    return this.sharesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Find share by symbol' })
  @ApiQuery({ name: 'symbol', required: true, example: 'AAPL' })
  @ApiResponse({
    status: 200,
    description: 'Share details'
  })
  @ApiResponse({ status: 404, description: 'Share not found' })
  async findOne(@Query('symbol') symbol: string) {
    return this.sharesService.findOneBySymbol(symbol);
  }

  @Get('all')
  @ApiOperation({ 
    summary: 'Obtener todas las acciones disponibles en Alpaca',
    description: 'Devuelve un listado con el símbolo y nombre de todas las acciones disponibles'
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de acciones',
    schema: {
      example: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' }
      ]
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error al obtener datos de Alpaca' 
  })
  async getAlpacaAssets() {
    return this.sharesService.getAllAlpacaAssets();
  }

}
