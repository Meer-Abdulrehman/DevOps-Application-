import os from 'node:os';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer | undefined;

/** Starts a throwaway in-memory MongoDB and connects Mongoose to it. */
export async function connectTestDb(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {
    // The MongoDB driver (v7+) loads `os` via a dynamic import(), which Jest's
    // CommonJS sandbox doesn't support. Passing it explicitly avoids a failed
    // handshake ("Missing required sub-document 'driver'"). Only needed in tests.
    runtimeAdapters: { os },
  });
}

/** Removes all documents so each test starts from a clean state. */
export async function clearTestDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function closeTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
