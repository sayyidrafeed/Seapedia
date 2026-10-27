import { createOutboxRelay } from '@seapedia/platform/events';
import { app } from './app';
import { config } from './config';
import { identityOutbox } from './modules/events/events.index';
import { OAuthService } from './modules/oauth/oauth.index';
import { runtime } from './runtime';

await OAuthService.syncClients();
await runtime.start(app.fetch);

createOutboxRelay({
  rabbit: runtime.rabbit,
  store: identityOutbox.store,
  intervalMs: config.get().outboxIntervalMs,
}).start();
