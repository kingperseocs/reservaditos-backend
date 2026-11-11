import request from 'supertest';
import { App } from 'supertest/types';
import {
  closeTestApp,
  createTestApp,
  TestContext,
} from './utils/create-test-app';

describe('GET /v1/health', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(context);
  });

  it('reports the service and database as up', async () => {
    const response = await request(context.app.getHttpServer() as App)
      .get('/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });
});
