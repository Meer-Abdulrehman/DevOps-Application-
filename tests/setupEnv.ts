// Runs before every test file. Never point tests at a real database:
// the actual URI is replaced by an in-memory MongoDB in tests/helpers/db.ts.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://placeholder-overridden-by-memory-server';
process.env.LOG_LEVEL = 'error';
