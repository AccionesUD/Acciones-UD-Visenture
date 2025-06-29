// src/mercado-pago.config.ts
import { config } from 'dotenv';
config(); // <<— Aquí cargas .env antes de todo
import { MercadoPagoConfig } from 'mercadopago';

console.log('MP token:', process.env.MP_ACCESS_TOKEN_SANDBOX);
export const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_SANDBOX!,
  options: { timeout: 5000 },
});
