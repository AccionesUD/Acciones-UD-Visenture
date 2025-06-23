# 🛡️ Guía para Protección de Endpoints: Roles y Suscripciones Premium (NestJS)

Esta guía explica **cómo proteger tus endpoints** usando guards y decoradores de roles/permisos, y cómo aplicar el control de acceso premium en tu backend NestJS.

---

## 1. Proteger endpoints según roles

Utiliza los guards de autenticación y roles, y el decorador `@Roles`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'comisionista')
@Get('admin-only')
getOnlyAdmins(@Req() req) {
  return { message: 'Solo admins/comisionistas pueden ver esto' };
}
```

## 2. Proteger endpoints premium

Utiliza el guard de suscripción premium junto con el guard de autenticación:

```typescript
import { SubscriptionGuard } from 'src/subscriptions/guards/subscription.guard';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Get('charts/premium')
getPremiumCharts(@Req() req: Request & { user: JwtPayloadUser }) {
  return {
    message: '¡Acceso permitido a funcionalidad premium!',
    usuario: req.user,
    fecha: new Date(),
  };
}
```

## 3. Combinar roles y premium

Utiliza el guard de suscripción premium junto con el guard de autenticación:
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SubscriptionGuard } from 'src/subscriptions/guards/subscription.guard';

@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('admin')
@Get('premium/admin-report')
getAdminPremiumReport(@Req() req: Request & { user: JwtPayloadUser }) {
  // lógica...  
}