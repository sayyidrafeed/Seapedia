import { app } from './app';
import { runtime } from './runtime';
import { consumer } from './sync/consumer';
import { ensureIndex } from './sync/reindex';

await runtime.start(app.fetch);

// Events queue up from the start (the queue comes from infra/rabbitmq/init.ts); handlers wait for
// the index. Until it exists catalog falls back to database search.
consumer.start();
for (;;) {
  try {
    await ensureIndex();
    break;
  } catch (error) {
    console.error(JSON.stringify({ event: 'index_bootstrap_failed', error: String(error) }));
    await Bun.sleep(5000);
  }
}
