En esta rama esta la pasarela de pago de Mercado Pago, la cual se encarga de procesar los pagos de los usuarios.

## 🚀 Pasarela de Pago Mercado Pago

En esta rama está la pasarela de pago de **Mercado Pago**, la cual se encarga de procesar los pagos de los usuarios.

---

## ⭐ Para Suscripciones Premium

Cuando se implemente esto hacia el backend y main, es necesario corregir lo siguiente:

---

### 🗑️ Eliminar archivos y carpetas innecesarias

- Quitar la carpeta `public` y los archivos HTML internos que no se usan.

---

### 🛠️ Cambios en `App.MODULE.TS`

Eliminar el siguiente bloque de código:

```typescript
// Esto se puede borrar después de que hagan la prueba de la pasarela de pago
ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public'),
    serveRoot: '/public',
}),
```

---

### 🛡️ Cambios en `main.ts`

Quitar las siguientes líneas y dejar solo el dominio del frontend:

```typescript
origin: [
    'http://localhost:4200', // permite configurar los dominios desde los que puede recibir peticiones
    'http://127.0.0.7:5500', // donde sirves test-pago.html
    'http://localhost:5500', // si lo sirves así
    // NOTA: esto se debe borrar después de hacer la prueba y dejar solo el del front
],
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
credentials: true,
```

---

### 📡 Endpoints Disponibles

Los endpoints a usar están en el controller `payment.controller.ts`:

- `POST http://localhost:3000/api/payments/subscribe`
- `POST http://localhost:3000/api/payments/crear-preferencia`

> ⚠️ **Ambos requieren el Bearer Token.**  
> Para más información, consulta la carpeta:  
> `payments/http_MercaPa`

---