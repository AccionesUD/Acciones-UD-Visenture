export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authApiUrl: 'http://localhost:3000/api/auth',  
  appName: 'Visenture',
  tokenExpiryNotification: 60,
  newsApiKey: 'demo',
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