import { createOutboxRelay } from '@seapedia/platform/events';
import { app } from './app';
import { config } from './config';
import { replicaConsumer } from './modules/catalog-sync/catalog-sync.index';
import { commerceOutbox } from './modules/events/events.index';
import { runtime } from './runtime';

await runtime.start(app.fetch);
replicaConsumer.start();
createOutboxRelay({
  rabbit: runtime.rabbit,
  store: commerceOutbox.store,
  intervalMs: config.get().outboxIntervalMs,
}).start();
