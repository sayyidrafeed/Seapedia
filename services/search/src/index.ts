import { app } from './app';
import { runtime } from './runtime';
import { consumer } from './sync/consumer';
import { ensureIndex } from './sync/reindex';

await runtime.start(app.fetch);

// Build the index on first boot, then follow catalog's events. Until then catalog falls back to
// database search.
for (;;) {
  try {
    await ensureIndex();
    break;
  } catch (error) {
    console.error(JSON.stringify({ event: 'index_bootstrap_failed', error: String(error) }));
    await Bun.sleep(5000);
  }
}
consumer.start();
