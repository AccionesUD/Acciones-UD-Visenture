# Acciones-UD-Visenture

Repositorio destinado al desarrollo de la aplicación Acciones UD por parte de Visenture.

## Descripción General

Acciones-UD-Visenture es una aplicación integral de gestión de inversiones y trading de acciones, diseñada para simular operaciones en el mercado de valores en tiempo real. Permite a los usuarios comprar y vender acciones, gestionar sus carteras, y acceder a análisis de mercado. La aplicación está dividida en dos componentes principales: un backend robusto desarrollado con NestJS y un frontend interactivo construido con Angular.

## Estructura del Proyecto

El proyecto se organiza en dos directorios principales:

-   `backend/`: Contiene el código fuente del servidor API.
-   `frontend/`: Contiene el código fuente de la aplicación web.

### Backend (NestJS)

El backend está construido con NestJS, un framework progresivo de Node.js para construir aplicaciones del lado del servidor eficientes y escalables.

**Características Principales:**

-   **API RESTful Completa:** Proporciona endpoints robustos para la gestión de usuarios, cuentas, órdenes, transacciones, acciones, carteras, alertas de precio, notificaciones y suscripciones.
-   **Integración con Alpaca Broker:** Conexión directa con la API de Alpaca para la inicialización de mercados, obtención de datos de acciones en tiempo real, y simulación de operaciones de trading (compra/venta).
-   **Gestión Transaccional Avanzada:** Manejo completo del ciclo de vida de órdenes de compra y venta, seguimiento detallado de transacciones, y gestión dinámica de carteras de inversión.
-   **Autenticación y Autorización Segura:** Implementa mecanismos de seguridad robustos, incluyendo autenticación basada en tokens y autorización basada en roles y permisos (`roles-permission` y `tokens` módulos) para controlar el acceso a las funcionalidades.
-   **Sistema de Notificaciones:** Módulo dedicado (`notifications` y `mail`) para el envío de notificaciones por diversos canales (email, push, SMS, WhatsApp) y gestión de alertas de precio personalizadas (`price-alerts`).
-   **Gestión de Suscripciones y Premium:** Soporte para diferentes niveles de suscripción (`subscriptions` y `premium`), permitiendo el acceso a funcionalidades avanzadas.
-   **Módulos Coherentes:** Código organizado en módulos lógicos como `accounts`, `advisor`, `alpaca_broker`, `auth`, `briefcases`, `events-alpaca`, `mail`, `notifications`, `orders`, `payments`, `preferences`, `premium`, `price-alerts`, `roles-permission`, `shares`, `stocks`, `subscriptions`, `tokens`, `transactions`, y `users`, facilitando la modularidad, escalabilidad y mantenimiento.
-   **Analíticas y Reportes:** Proporciona datos analíticos detallados para la administración y comisionistas, incluyendo métricas sobre usuarios, órdenes, recargas, comisiones, activos y perfiles de riesgo.

**Tecnologías:**

-   Node.js
-   NestJS
-   TypeScript
-   MongoDB (o la base de datos configurada)
-   Alpaca API

**Configuración y Ejecución del Backend:**

1.  **Instalar dependencias:**
    ```bash
    cd backend
    npm install
    ```
2.  **Configurar variables de entorno:**
    Crea un archivo `.env` en el directorio `backend/` con las variables de entorno necesarias (ej. `DATABASE_URL`, `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, etc.). Consulta la documentación interna para una lista completa de variables requeridas.
3.  **Ejecutar la aplicación:**
    ```bash
    npm run start:dev
    ```
    El backend se ejecutará por defecto en `http://localhost:3000`.

### Frontend (Angular)

El frontend es una aplicación web desarrollada con Angular, que proporciona una interfaz de usuario rica e interactiva para los usuarios y administradores.

**Características Principales:**

-   **Dashboard de Usuario Personalizado:** Ofrece una vista integral del estado de la cartera, permitiendo a los usuarios realizar operaciones de compra/venta de acciones, y acceder a un historial detallado de transacciones y órdenes.
-   **Gestión de Perfil Completa:** Incluye secciones para información personal, preferencias de usuario (alertas de precio, métodos de notificación, mercados y sectores de interés, configuración de operaciones), seguridad (cambio de contraseña, verificación en dos pasos) y gestión de suscripciones.
-   **Panel de Comisionista (Simulado):** Un módulo dedicado para comisionistas que les permite gestionar sus clientes, visualizar reportes de rendimiento y monitorear comisiones generadas. Es importante destacar que esta funcionalidad está actualmente simulada y no completamente implementada con datos reales.
-   **Panel de Administración:** Proporciona a los administradores un dashboard con analíticas clave del sistema, herramientas para la gestión de mercados (inicialización, edición de horarios) y la creación de acciones de prueba. También incluye un módulo para la administración de usuarios.
-   **Gestión de Fondos:** Funcionalidades intuitivas para añadir fondos a las cuentas de usuario y consultar un historial completo de transacciones financieras.
-   **Autenticación y Seguridad:** Flujos completos de login, registro, recuperación y reseteo de contraseña, con soporte para verificación en dos pasos, garantizando una gestión segura de usuarios.
-   **Mercados y Acciones:** Permite explorar los mercados disponibles, ver detalles de cada mercado (horarios, estado actual) y listar las acciones disponibles, con opciones para comprar y vender.
-   **Notificaciones en Tiempo Real:** Una sección dedicada para visualizar todas las notificaciones recibidas, incluyendo alertas de precio y actualizaciones de transacciones.
-   **Componentes Reutilizables y Modales:** Utiliza una biblioteca de componentes compartidos y modales (`shared/modals`) para operaciones como compra/venta de acciones, confirmación de contratación de comisionistas, y visualización de snapshots de mercado, asegurando consistencia y eficiencia en la UI.
-   **Visualización de Datos Interactiva:** Integración de `ng-apexcharts` para la representación gráfica de datos financieros y analíticos, proporcionando insights claros y dinámicos.
-   **Soporte Multi-idioma:** Implementación de i18n para soportar múltiples idiomas (español, inglés, francés, ruso), mejorando la accesibilidad global.
-   **Temas Personalizables:** Permite a los usuarios cambiar entre temas claro y oscuro para una experiencia visual adaptada.

**Tecnologías:**

-   Angular
-   TypeScript
-   HTML5
-   CSS3 (con Tailwind CSS para estilos)
-   ng-apexcharts
-   Angular Material (para algunos componentes UI)

**Configuración y Ejecución del Frontend:**

1.  **Instalar dependencias:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Configurar el entorno:**
    Asegúrate de que `environment.ts` y `environment.prod.ts` en `frontend/src/environments/` apunten a la URL correcta del backend (por defecto `http://localhost:3000/api`).
3.  **Ejecutar la aplicación:**
    ```bash
    npm run start
    ```
    La aplicación se abrirá en tu navegador en `http://localhost:4200`.

## Contribución

Para contribuir a este proyecto, por favor sigue los siguientes pasos:

1.  Haz un fork del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y commitea (`git commit -am 'feat: Añadir nueva funcionalidad'`).
4.  Sube tus cambios a tu fork (`git push origin feature/nueva-funcionalidad`).
5.  Abre un Pull Request.
