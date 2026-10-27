import { PGlite } from '@electric-sql/pglite';
import type { EventEnvelope } from '@seapedia/platform/events';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { outbox, schema } from '@/db/schema';

// One in-process Postgres per test run, migrated like production; test/setup.ts serves it as `@/db`.
export const db = drizzle(new PGlite(), { schema });
await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });

const { rows } = await db.execute<{ tablename: string }>(
  sql`select tablename from pg_tables where schemaname = 'public'`,
);
const tables = rows.map((r) => `"${r.tablename}"`).join(', ');

export async function resetDb() {
  await db.execute(sql.raw(`truncate ${tables} restart identity cascade`));
}

// Events the code under test enqueued, read back from the real outbox table.
export async function outboxEvents(): Promise<EventEnvelope[]> {
  const rows = await db.select({ payload: outbox.payload }).from(outbox);
  return rows.map((r) => r.payload);
}
