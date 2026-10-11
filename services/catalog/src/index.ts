import { app } from './app';
import { env } from './env';
import { commerceEventsConsumer } from './modules/events/events.consumer';

console.log(`catalog service listening on :${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

commerceEventsConsumer.start();
