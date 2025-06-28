const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.config().parsed;

const environment = {
  production: true,
  apiUrl: env.NG_APP_API_URL,
  authApiUrl: env.NG_APP_AUTH_API_URL,
  appName: env.NG_APP_APP_NAME,
  tokenExpiryNotification: Number(env.NG_APP_TOKEN_EXPIRY_NOTIFICATION),
  newsApiKey: env.NG_APP_NEWS_API_KEY,
  alpaca: {
    baseUrl: env.NG_APP_ALPACA_BASE_URL,
    dataBaseUrl: env.NG_APP_ALPACA_DATA_BASE_URL,
    apiKey: env.NG_APP_ALPACA_API_KEY,
    secretKey: env.NG_APP_ALPACA_SECRET_KEY
  },
  alpacaBroker: {
    baseUrl: env.NG_APP_ALPACA_BROKER_BASE_URL,
    apiKey: env.NG_APP_ALPACA_BROKER_API_KEY,
    secretKey: env.NG_APP_ALPACA_BROKER_SECRET_KEY,
    credentials: env.NG_APP_ALPACA_BROKER_CREDENTIALS,
    email: env.NG_APP_ALPACA_BROKER_EMAIL,
    password: env.NG_APP_ALPACA_BROKER_PASSWORD
  }
};

fs.writeFileSync(
  './src/environments/environment.prod.ts',
  'export const environment = ' + JSON.stringify(environment, null, 2) + ';\n'
);
console.log('Archivo environment.prod.ts generado desde .env');
