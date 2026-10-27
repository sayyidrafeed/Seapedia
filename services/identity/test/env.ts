import { exportPKCS8, exportSPKI, generateKeyPair } from 'jose';

// Test environment: validates env.ts without Consul, RabbitMQ or a database. Also preloaded by
// scripts/openapi.ts, so no test-runner hooks here.
const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.JWT_PRIVATE_KEY ??= await exportPKCS8(privateKey);
process.env.JWT_PUBLIC_KEY ??= await exportSPKI(publicKey);
process.env.SERVICE_CLIENT_SECRETS ??= 'catalog=test-catalog-secret-0000';
process.env.CONSUL_HTTP_ADDR ??= 'http://consul.test:8500';
process.env.RABBITMQ_URL ??= 'amqp://test:test@rabbit.test:5672/seapedia';
