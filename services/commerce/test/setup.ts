import { exportPKCS8, exportSPKI, generateKeyPair } from 'jose';

// Unit tests mock the database and never reach Consul or RabbitMQ; env only needs to validate.
// The private half signs test access tokens (test/tokens.ts).
const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.JWT_PUBLIC_KEY ??= await exportSPKI(publicKey);
process.env.TEST_JWT_PRIVATE_KEY ??= await exportPKCS8(privateKey);
process.env.CONSUL_HTTP_ADDR ??= 'http://consul.test:8500';
process.env.RABBITMQ_URL ??= 'amqp://test:test@rabbit.test:5672/seapedia';
