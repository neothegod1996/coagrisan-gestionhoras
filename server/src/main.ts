import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions-filter';
import { ValidationPipe } from '@nestjs/common';
import { text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: process.env.NODE_ENV === 'production',
      whitelist: true,
      transform: true,
    }),
  );
  app.use(text({ type: 'text/plain' }));
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(process.env.PORT ?? 4000, "0.0.0.0");
}
bootstrap();
