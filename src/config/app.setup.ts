import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

/** HTTP behaviour shared by the running server and the e2e tests. */
export function configureApp(app: INestApplication): void {
  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
