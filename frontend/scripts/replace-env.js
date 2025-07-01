const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const replacements = {
  'REEMPLAZAR_API_URL': process.env.NG_APP_API_URL || '',
  'REEMPLAZAR_AUTH_API_URL': process.env.NG_APP_AUTH_API_URL || '',
  'REEMPLAZAR_APP_NAME': process.env.NG_APP_APP_NAME || '',
  'REEMPLAZAR_NEWS_API_KEY': process.env.NG_APP_NEWS_API_KEY || '',
  'REEMPLAZAR_ALPACA_BASE_URL': process.env.NG_APP_ALPACA_BASE_URL || '',
  'REEMPLAZAR_ALPACA_DATA_BASE_URL': process.env.NG_APP_ALPACA_DATA_BASE_URL || '',
  'REEMPLAZAR_ALPACA_API_KEY': process.env.NG_APP_ALPACA_API_KEY || '',
  'REEMPLAZAR_ALPACA_SECRET_KEY': process.env.NG_APP_ALPACA_SECRET_KEY || '',
  'REEMPLAZAR_ALPACA_BROKER_BASE_URL': process.env.NG_APP_ALPACA_BROKER_BASE_URL || '',
  'REEMPLAZAR_ALPACA_BROKER_API_KEY': process.env.NG_APP_ALPACA_BROKER_API_KEY || '',
  'REEMPLAZAR_ALPACA_BROKER_SECRET_KEY': process.env.NG_APP_ALPACA_BROKER_SECRET_KEY || '',
  'REEMPLAZAR_ALPACA_BROKER_CREDENTIALS': process.env.NG_APP_ALPACA_BROKER_CREDENTIALS || '',
  'REEMPLAZAR_ALPACA_BROKER_EMAIL': process.env.NG_APP_ALPACA_BROKER_EMAIL || '',
  'REEMPLAZAR_ALPACA_BROKER_PASSWORD': process.env.NG_APP_ALPACA_BROKER_PASSWORD || ''
};

function replaceInFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }
  fs.writeFileSync(file, content);
}

replaceInFile('./src/environments/environment.ts');
replaceInFile('./src/environments/environment.prod.ts');
console.log('Variables de entorno reemplazadas en archivos de environment.');
