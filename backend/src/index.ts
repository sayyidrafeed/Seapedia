import { app } from './app';
import { env } from './env';

console.log(`Server is running on http://localhost:${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});
