import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const USER_ID_HEADER = 'x-user-id';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Reservaditos API')
    .setDescription(
      'Common-area bookings for a residential building. Residents request and pay; the administration approves, rejects and suspends areas.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: USER_ID_HEADER,
        description: 'Simulated identity: id of the seeded resident or admin.',
      },
      USER_ID_HEADER,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
