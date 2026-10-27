import { Client, HttpConnection } from '@elastic/elasticsearch';
import { env } from '@/env';

export const elastic = new Client({
  node: env.ELASTICSEARCH_URL,
  auth: { username: env.ELASTICSEARCH_USERNAME, password: env.ELASTICSEARCH_PASSWORD },
  // The default undici-based connection does not work on Bun; the node:http one does.
  Connection: HttpConnection,
  requestTimeout: 5000,
});
