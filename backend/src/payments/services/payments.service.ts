// src/payments/payments.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
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
