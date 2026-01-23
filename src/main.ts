import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimingInterceptor } from './shared/interceptors/timing.interceptor';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // RAW body ONLY for webhook route
  app.use('/checkout/webhook', express.raw({ type: 'application/json' }));

  // Global JSON parser for all other routes
  app.use(express.json());

  app.useGlobalInterceptors(new TimingInterceptor());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(8000);
}
bootstrap();
