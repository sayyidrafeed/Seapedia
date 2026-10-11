import { Client } from '@elastic/elasticsearch';
import { env } from '@/env';

export const elastic = new Client({
  node: env.ELASTICSEARCH_URL,
  auth: { username: env.ELASTICSEARCH_USERNAME, password: env.ELASTICSEARCH_PASSWORD },
  requestTimeout: 5000,
});
