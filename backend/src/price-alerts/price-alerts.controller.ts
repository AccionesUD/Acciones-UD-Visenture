import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  HttpException, 
  HttpStatus,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { PriceAlertsService } from './price-alerts.service';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/advisor/dto/auth-request.dto';

@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private readonly alertsService: PriceAlertsService) {}

  @Post('new')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreatePriceAlertDto
  ) {
    try {
      // Validación de campos requeridos
      if (!createDto.share_id || !createDto.target_price || !createDto.direction) {
        throw new BadRequestException('Faltan campos requeridos: share_id, target_price o direction');
      }

      const result = await this.alertsService.create(Number(req.user.accountId), createDto);
      return {
        success: true,
        message: 'Alerta de precio creada correctamente',
      };
    } catch (error) {
      console.error('Error al crear alerta:', error);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('premium')) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException('Recurso no encontrado');
      }
      
      // Error genérico para casos no manejados
      throw new HttpException(
        error.message || 'Error interno al crear alerta de precio',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllUserAlerts(@Req() req: AuthenticatedRequest) {
    try {
      const alerts = await this.alertsService.findAllByAccount(req.user.accountId);
      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      
      throw new HttpException(
        error.message || 'Error interno al obtener alertas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async deleteAlert(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    try {
      await this.alertsService.deleteAlert(req.user.accountId, id);
      return {
        success: true,
        message: 'Alerta eliminada correctamente'
      };
    } catch (error) {
      console.error('Error al eliminar alerta:', error);
      
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('no tiene permiso')) {
        throw new ForbiddenException(error.message);
      }
      
      throw new HttpException(
        error.message || 'Error interno al eliminar alerta',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}