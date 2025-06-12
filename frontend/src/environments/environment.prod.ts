// Variables de entorno de producción
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
  authApiUrl: 'http://localhost:3000/api/auth',  // Corregido para usar el prefijo global 'api'
  appName: 'Visenture',
  tokenExpiryNotification: 60, // segundos antes de notificar que el token va a expirar
  // Configuración de Alpaca
  alpaca: {
    apiKey: 'PKQ306VP6O0TZJTI003J',
    secretKey: 'dGmY0cbCLmpedASnKfdSBkAVDD2coc3N7xHLlRyw',
    baseUrl: 'https://paper-api.alpaca.markets/v2'
  },
  // Configuración de Alpaca Broker
  alpacaBroker: {
    apiKey: 'CKSLAXCW05O7CJYGAE5K',
    secretKey: '1lz5eIY9pZnszgmKVwLrahYFuKBMfLWBporEf3WL',
    baseUrl: 'https://broker-api.sandbox.alpaca.markets'
  }
};