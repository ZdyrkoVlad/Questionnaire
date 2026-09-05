import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development flexibility
  app.enableCors();

  // Enable automatic validation transforms
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Render sets PORT dynamically. We bind to 0.0.0.0 for container/Render compatibility.
  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(`====================================================`);
  logger.log(` Questionnaire NestJS server running!`);
  logger.log(` Local URL:    http://localhost:${port}`);
  logger.log(` Network URL:  http://${host}:${port}`);
  logger.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
  logger.log(`====================================================`);
}

bootstrap();
