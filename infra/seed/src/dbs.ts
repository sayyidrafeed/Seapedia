import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { MongoClient, type Db as MongoDb } from 'mongodb';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema';

export const env = z
  .object({
    IDENTITY_DATABASE_URL: z.string().url(),
    COMMERCE_DATABASE_URL: z.string().url(),
    CATALOG_MONGODB_URL: z.string().startsWith('mongodb'),
    CONSUL_HTTP_ADDR: z.string().url().optional(),
    SEED_CLIENT_SECRET: z.string().optional(),
  })
  .parse(process.env);

function connect(url: string) {
  const client = postgres(url, { max: 1 });
  return { client, db: drizzle(client, { schema }) };
}

export const connections = {
  identity: connect(env.IDENTITY_DATABASE_URL),
  commerce: connect(env.COMMERCE_DATABASE_URL),
  catalog: new MongoClient(env.CATALOG_MONGODB_URL),
};

type Db = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

// identity and commerce in one open transaction each; catalog is MongoDB.
export type Dbs = { identity: Tx; commerce: Tx; catalog: MongoDb };
