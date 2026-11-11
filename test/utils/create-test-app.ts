import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/config/app.setup';
import { CLOCK } from '../../src/shared/domain/ports';
import { NOW } from '../builders/reservation.builder';
import { FakeClock } from '../fakes/fake-clock';

/** MongoDB comes from test/setup/global-setup.ts (in-memory, never the local .env). */
export interface TestContext {
  app: INestApplication;
  clock: FakeClock;
}

export async function createTestApp(): Promise<TestContext> {
  const clock = new FakeClock(NOW);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CLOCK)
    .useValue(clock)
    .compile();

  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();

  return { app, clock };
}

export async function closeTestApp(context?: TestContext): Promise<void> {
  await context?.app.close();
}

/** supertest agent that sends the simulated identity header. */
export function as(context: TestContext, userId?: string) {
  const server = context.app.getHttpServer() as App;
  const withUser = (test: request.Test) =>
    userId ? test.set('x-user-id', userId) : test;
  return {
    get: (url: string) => withUser(request(server).get(url)),
    post: (url: string) => withUser(request(server).post(url)),
    patch: (url: string) => withUser(request(server).patch(url)),
  };
}
