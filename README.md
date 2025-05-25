# Acciones UD - Plataforma de Gestión de Acciones Universitarias

## Descripción del Proyecto

Acciones UD es una aplicación web desarrollada por Visenture para la gestión integral de acciones universitarias en la Universidad Distrital. La plataforma permite a estudiantes, profesores y personal administrativo gestionar, adquirir y transferir acciones universitarias de manera segura y transparente.

## Tecnologías Utilizadas

### Backend
- NestJS (Framework de Node.js)
- TypeORM para ORM
- PostgreSQL como base de datos
- JWT para autenticación
- Sistema de autenticación de dos factores (2FA)

### Frontend
- Angular 19
- TailwindCSS para estilos
- Angular Material para componentes UI

## Características Principales

- **Autenticación Segura**: Sistema de login con verificación de dos factores mediante tokens enviados por correo electrónico
- **Gestión de Usuarios**: Diferentes roles (estudiante, administrador, etc.) con permisos específicos
- **Gestión de Acciones**: Compra, venta y transferencia de acciones universitarias
- **Panel de Administración**: Para monitoreo y gestión del sistema
- **Notificaciones**: Sistema de notificaciones en tiempo real y por correo electrónico

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- **Backend**: API RESTful desarrollada con NestJS
- **Frontend**: Aplicación SPA desarrollada con Angular

## Configuración e Instalación

### Requisitos Previos
- Node.js >= 18.x
- PostgreSQL >= 13.x
- Angular CLI >= 19.x

### Instalación del Backend
```bash
cd backend
npm install
```

### Instalación del Frontend
```bash
cd frontend
npm install
```

### Variables de Entorno
Ver archivo `ENV_CONFIG.md` para detalles sobre la configuración de variables de entorno.

## Ejecución del Proyecto

### Modo Desarrollo
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
ng serve
```

### Modo Producción
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
ng build --configuration=production
```

## Equipo de Desarrollo
- Desarrollado por [Visenture](https://github.com/visenture)
