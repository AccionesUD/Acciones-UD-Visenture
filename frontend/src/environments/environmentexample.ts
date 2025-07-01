// filepath: /workspaces/Acciones-UD-Visenture/frontend/src/environments/environment.ts
export const environmentExample = {
    production: true,
    apiUrl: 'https://api.example.com/v1',
    authApiUrl: 'https://api.example.com/v1/auth',
    appName: 'ExampleApp',
    tokenExpiryNotification: 30,
    newsApiKey: 'your-news-api-key',
    alpaca: {
        baseUrl: 'https://paper-api.alpaca.example.com/v2',
        dataBaseUrl: 'https://data.alpaca.example.com/v2',
        apiKey: 'YOUR_ALPACA_API_KEY',
        secretKey: 'YOUR_ALPACA_SECRET_KEY'
    },
    alpacaBroker: {
        baseUrl: 'https://broker-api.example.com',
        apiKey: 'YOUR_BROKER_API_KEY',
        secretKey: 'YOUR_BROKER_SECRET_KEY',
        credentials: 'YOUR_BROKER_CREDENTIALS',
        email: 'user@example.com',
        password: 'your-secure-password'
    }
};