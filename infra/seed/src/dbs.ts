import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema';

const env = z
  .object({
    IDENTITY_DATABASE_URL: z.string().url(),
    CATALOG_DATABASE_URL: z.string().url(),
    COMMERCE_DATABASE_URL: z.string().url(),
  })
  .parse(process.env);

function connect(url: string) {
  const client = postgres(url, { max: 1 });
  return { client, db: drizzle(client, { schema }) };
}

export const connections = {
  identity: connect(env.IDENTITY_DATABASE_URL),
  catalog: connect(env.CATALOG_DATABASE_URL),
  commerce: connect(env.COMMERCE_DATABASE_URL),
};

type Db = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** One open transaction per service database. */
export type Dbs = { identity: Tx; catalog: Tx; commerce: Tx };
