// src/mercado-pago.config.ts
import { config } from 'dotenv';
config(); // <<— Aquí se carga el .env antes de todo
import { MercadoPagoConfig } from 'mercadopago';

//Archivos de configuración para la pasarela de pago v3 sdk MP

console.log('MP token:', process.env.MP_ACCESS_TOKEN_SANDBOX);
export const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_SANDBOX!,
  options: { timeout: 5000 },
});
