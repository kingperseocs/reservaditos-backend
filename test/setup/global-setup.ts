import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Starts one in-memory MongoDB for every e2e suite and exposes it through
 * MONGODB_URI before any test file imports AppModule (which validates env vars).
 */
export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  (globalThis as { __MONGO__?: MongoMemoryServer }).__MONGO__ = mongo;
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri('reservaditos-test');
  process.env.PUBLIC_BASE_URL = 'http://localhost:8000';
}
