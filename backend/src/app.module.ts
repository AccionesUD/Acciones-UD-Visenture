import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [UsersModule, AccountsModule, 
            TypeOrmModule.forRootAsync({
              useFactory: () => ({
                type: 'postgres',
                autoLoadEntities: true,
                synchronize: true, 
                port: 5432,
                username: 'root',
                password: 'root',
                database: 'visenture',
                host: 'localhost'
              })
            }), AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
