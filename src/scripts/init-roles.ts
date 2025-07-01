// src/scripts/init-roles.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { RolesPermissionService } from 'src/roles-permission/services/roles-permission.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rolesService = app.get(RolesPermissionService);
  await rolesService.ensureDefaultRoles();
  await app.close();
  console.log('Roles por defecto inicializados.');
}

bootstrap();

//se corre con: npx ts-node src/scripts/init-roles.ts
