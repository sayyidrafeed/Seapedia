import { app } from './app';
import { env } from './env';
import { catalogEventsConsumer } from './sync/consumer';
import { ensureIndex } from './sync/reindex';

console.log(`search service listening on :${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

// Build the index on first boot, then keep it in step with catalog. If Elasticsearch or catalog is
// not up yet, retry: catalog falls back to database search meanwhile.
async function start() {
  for (;;) {
    try {
      await ensureIndex();
      break;
    } catch (error) {
      console.error(JSON.stringify({ event: 'index_bootstrap_failed', error: String(error) }));
      await Bun.sleep(5000);
    }
  }
  catalogEventsConsumer.start();
}

void start();
