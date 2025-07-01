import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

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
  });
  // Configura Bull Board
  const notificationsQueue = app.get<Queue>(getQueueToken('notifications'));
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullAdapter(notificationsQueue)], // ← Pasa tu instancia aquí
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
