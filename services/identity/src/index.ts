import { app } from './app';
import { env } from './env';

console.log(`identity service listening on :${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});
