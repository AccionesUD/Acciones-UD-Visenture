import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesPermissionService } from './services/roles-permission.service';
import { RolesPermissionController } from './controllers/roles-permission/roles-permission.controller';
import { Permission } from './entities/permission.entity';
import { RolesSeedService } from './services/roles-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]), // <-- Importante
  ],
  providers: [RolesPermissionService, RolesSeedService],
  controllers: [RolesPermissionController],
  exports: [RolesPermissionService],
})
export class RolesPermissionModule {}
