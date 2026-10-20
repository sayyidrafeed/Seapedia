import { exportSPKI, generateKeyPair } from 'jose';

// Unit tests never reach Elasticsearch, Consul or RabbitMQ; env only needs to validate.
const { publicKey } = await generateKeyPair('RS256', { extractable: true });
process.env.JWT_PUBLIC_KEY ??= await exportSPKI(publicKey);
process.env.SERVICE_CLIENT_SECRET ??= 'test-search-secret-0000';
process.env.CONSUL_HTTP_ADDR ??= 'http://consul.test:8500';
process.env.RABBITMQ_URL ??= 'amqp://test:test@rabbit.test:5672/seapedia';
process.env.ELASTICSEARCH_URL ??= 'http://elasticsearch.test:9200';
process.env.ELASTICSEARCH_PASSWORD ??= 'test';
