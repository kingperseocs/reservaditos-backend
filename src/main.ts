import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './config/app.setup';
import { EnvironmentVariables } from './config/env.validation';
import { setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  configureApp(app);
  setupSwagger(app);
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API ready at http://localhost:${port}/v1`, 'Bootstrap');
  Logger.log(`Swagger at http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
