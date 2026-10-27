import { beforeEach, mock } from 'bun:test';
import { exportPKCS8, exportSPKI, generateKeyPair } from 'jose';

// Unit tests run against in-process Postgres (test/db.ts) and never reach Consul or RabbitMQ.
const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.JWT_PRIVATE_KEY ??= await exportPKCS8(privateKey);
process.env.JWT_PUBLIC_KEY ??= await exportSPKI(publicKey);
process.env.SERVICE_CLIENT_SECRETS ??= 'catalog=test-catalog-secret-0000';
process.env.CONSUL_HTTP_ADDR ??= 'http://consul.test:8500';
process.env.RABBITMQ_URL ??= 'amqp://test:test@rabbit.test:5672/seapedia';

// Registered once here: per-file mock.module of `@/db` leaks across files in one bun process.
const { db, resetDb } = await import('./db');
mock.module('@/db', () => ({ db }));
beforeEach(resetDb);
