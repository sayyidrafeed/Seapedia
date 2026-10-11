/**
 * Triggers a full reindex on the running search service (which serializes it with live sync).
 * Usage: bun src/reindex.cli.ts   (inside the search container, e.g. after seeding)
 */
import { env } from './env';

const response = await fetch(`http://localhost:${env.PORT}/search/reindex`, {
  method: 'POST',
  headers: { authorization: `Bearer ${env.INTERNAL_API_TOKEN}` },
});
console.log(response.status, await response.text());
process.exit(response.ok ? 0 : 1);
