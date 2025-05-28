import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: 'http://localhost:4200', // permite configurar los dominios desde los que puede recibir peticiones
  }),
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
