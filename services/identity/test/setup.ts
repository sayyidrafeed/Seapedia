import { beforeEach, mock } from 'bun:test';
import './env';

// Unit tests run against in-process Postgres (test/db.ts) and never reach Consul or RabbitMQ.
// Registered once here: per-file mock.module of `@/db` leaks across files in one bun process.
const { db, resetDb } = await import('./db');
mock.module('@/db', () => ({ db }));
beforeEach(resetDb);
