import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CrearPreferenciaDto } from '../dtos/crear-preferencia.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('crear-preferencia')
  crearPreferencia(@Body() dto: CrearPreferenciaDto) {
    return this.paymentsService.crearPreferencia(dto);
  }
}
