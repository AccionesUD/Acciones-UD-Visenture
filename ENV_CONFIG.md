# Configuración de variables de entorno

## Backend (NestJS)

Para que la aplicación funcione correctamente, es necesario configurar las siguientes variables en el archivo `.env`:

### Base de datos PostgreSQL:
- `DB_HOST`: Dirección del servidor de base de datos (por defecto: localhost)
- `DB_PORT`: Puerto de PostgreSQL (por defecto: 5432)
- `DB_USERNAME`: Usuario de la base de datos
- `DB_PASSWORD`: Contraseña del usuario de la base de datos
- `DB_DATABASE`: Nombre de la base de datos

### JWT (JSON Web Token):
- `JWT_SECRET`: Clave secreta para firmar los tokens de acceso
- `JWT_EXPIRES_IN`: Tiempo de validez de los tokens de acceso (ej: 1h, 1d)
- `JWT_REFRESH_SECRET`: Clave secreta para firmar los tokens de refresco
- `JWT_REFRESH_EXPIRES_IN`: Tiempo de validez de los tokens de refresco (ej: 7d)

### Configuración de correo:
- `MAIL_HOST`: Servidor SMTP (ejemplo: smtp.gmail.com para Gmail)
- `MAIL_PORT`: Puerto SMTP (587 para TLS, 465 para SSL)
- `MAIL_USER`: Dirección de correo electrónico desde donde se enviarán los emails
- `MAIL_PASSWORD`: Contraseña de aplicación (para Gmail, debes generar una en tu cuenta de Google)
- `MAIL_FROM`: Dirección de correo que aparecerá como remitente

### Configuración de la aplicación:
- `PORT`: Puerto donde correrá el servidor backend (por defecto: 3000)
- `NODE_ENV`: Entorno de ejecución (development, production)

## Instrucciones para Gmail:

1. Habilitar la verificación en dos pasos en tu cuenta de Google
2. Generar una contraseña de aplicación específica:
   - Ve a tu cuenta de Google > Seguridad
   - En "Acceso a Google", selecciona "Verificación en dos pasos"
   - Al final de la página, selecciona "Contraseñas de aplicación"
   - Selecciona "Otra" como aplicación, ponle un nombre (ej: "Visenture App") y haz clic en "Generar"
   - Copia la contraseña generada y úsala en MAIL_PASSWORD

## Frontend (Angular)

Las variables de entorno del frontend se encuentran en:
- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

Asegúrate de que las URLs de la API (`apiUrl` y `authApiUrl`) apunten correctamente a tu servidor backend.
