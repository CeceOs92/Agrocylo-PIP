import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Route Nest's internal logging through Pino.
  app.useLogger(app.get(Logger));

  configureApp(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;

  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Agrocylo PIP backend listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
