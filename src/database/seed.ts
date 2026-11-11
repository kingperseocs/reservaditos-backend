import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  BUILDING_SETTINGS,
  BuildingSettings,
  CLOCK,
  Clock,
} from '../shared/domain/ports';
import { DEMO_USERS, seedDemoData } from './demo-data';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const clock = app.get<Clock>(CLOCK);
  const building = app.get<BuildingSettings>(BUILDING_SETTINGS);

  await seedDemoData(app, clock.now(), building.timezone);
  await app.close();

  console.log(`Demo data loaded for ${building.name}`);
  console.log(
    `x-user-id → resident: ${DEMO_USERS.ana} · overdue: ${DEMO_USERS.rosa} · admin: ${DEMO_USERS.admin}`,
  );
}

void seed();
