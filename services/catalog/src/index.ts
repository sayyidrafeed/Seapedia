import { createOutboxRelay } from '@seapedia/platform/events';
import { app } from './app';
import { config } from './config';
import { setupDatabase } from './db/setup';
import { consumer } from './modules/events/consumers';
import { outboxStore } from './modules/events/events.index';
import { runtime } from './runtime';

await setupDatabase();
await runtime.start(app.fetch);
consumer.start();
createOutboxRelay({
  rabbit: runtime.rabbit,
  store: outboxStore,
  intervalMs: config.get().outboxIntervalMs,
}).start();
