import { app } from './app';
import { env } from './env';
import { catalogEventsConsumer } from './modules/catalog-sync/catalog-sync.index';

console.log(`commerce service listening on :${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

catalogEventsConsumer.start();
