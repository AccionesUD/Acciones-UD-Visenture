// Variables de entorno de producción
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
  authApiUrl: 'http://localhost:3000/api/auth',  // Corregido para usar el prefijo global 'api'
  appName: 'Visenture',
  tokenExpiryNotification: 60, // segundos antes de notificar que el token va a expirar
};
