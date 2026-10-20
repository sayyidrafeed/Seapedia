import { exportSPKI, generateKeyPair } from 'jose';

// Unit tests mock the repositories and never reach MongoDB, Consul or RabbitMQ.
const { publicKey } = await generateKeyPair('RS256', { extractable: true });
process.env.MONGODB_URL ??= 'mongodb://test:test@localhost:27017/test';
process.env.JWT_PUBLIC_KEY ??= await exportSPKI(publicKey);
process.env.SERVICE_CLIENT_SECRET ??= 'test-catalog-secret-0000';
process.env.CONSUL_HTTP_ADDR ??= 'http://consul.test:8500';
process.env.RABBITMQ_URL ??= 'amqp://test:test@rabbit.test:5672/seapedia';
