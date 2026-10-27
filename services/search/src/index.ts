import { app } from './app';
import { runtime } from './runtime';
import { consumer } from './sync/consumer';
import { ensureIndex } from './sync/reindex';

await runtime.start(app.fetch);

// The queue is declared first so no catalog event published during bootstrap is lost; handlers
// wait for the index. Until it exists catalog falls back to database search.
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
