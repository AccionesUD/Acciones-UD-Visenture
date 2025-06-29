// src/payments/payments.service.ts

import { Injectable } from '@nestjs/common';
import { mpConfig } from '../mercado-pago.config';
import { Preference } from 'mercadopago';
import { CrearPreferenciaDto } from '../dtos/crear-preferencia.dto';

@Injectable()
export class PaymentsService {
  private preferenceClient = new Preference(mpConfig);

  async crearPreferencia(
    dto: CrearPreferenciaDto,
  ): Promise<{ init_point: string; id: string }> {
    const { planId, monto, descripcion, emailUsuario } = dto;

    // Llamada a la API de Mercado Pago
    const preferenceResponse = await this.preferenceClient.create({
      body: {
        items: [
          {
            id: planId,
            title: descripcion,
            quantity: 1,
            unit_price: monto,
            currency_id: 'COP',
          },
        ],
        payer: { email: emailUsuario },
        back_urls: {
          success: 'https://tu-dominio.com/pago-exitoso',
          failure: 'https://tu-dominio.com/pago-fallido',
          pending: 'https://tu-dominio.com/pago-pendiente',
        },
        auto_return: 'approved',
      },
    });

    const initPoint = preferenceResponse.init_point;
    const preferenceId = preferenceResponse.id;

    if (!initPoint || !preferenceId) {
      throw new Error(
        'No se recibió init_point o id de la API de Mercado Pago',
      );
    }

    // Retornas directamente init_point e id
    return {
      init_point: initPoint,
      id: preferenceId,
    };
  }
  /**
   * Simula la validación de un token de pago.
   * Si el token contiene la palabra 'fail', la validación falla.
   * Para cualquier otro token, la validación es exitosa.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateToken(token: string, _amount: number): Promise<boolean> {
    // El guion bajo en _amount indica que es intencionalmente no usado
    if (token.includes('fail')) {
      return false;
    }
    return await Promise.resolve(true);
  }
}
