import { createServiceTokenProvider } from '@seapedia/platform/auth';
import { createResolver } from '@seapedia/platform/consul';
import { createInternalClient } from '@seapedia/platform/internal-client';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { connections, env, type Dbs, type Tx } from './dbs';
import { orderItems, orders, systemTimeOffset } from './schema';
import { rawUsers } from './seed/data/users.data';
import {
  seedUsers,
  seedWallets,
  seedStores,
  seedProducts,
  seedDiscounts,
  seedOrders,
  seedDelivery,
  seedReviews,
  seedCarts,
} from './seed/index';

const CATALOG_COLLECTIONS = ['stores', 'products', 'product_reviews', 'app_reviews', 'users', 'purchases', 'outbox', 'inbox'];

/** Seeding starts clean: every service table is emptied (migration history is untouched). */
async function wipePostgres(tx: Tx) {
  const tables = await tx.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (tables.length === 0) return;
  const names = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await tx.execute(sql.raw(`truncate table ${names} restart identity cascade`));
}

/** Catalog's sold counts are a read model of commerce's completed orders. */
async function syncSoldCounts({ catalog, commerce }: Dbs) {
  const sold = await commerce
    .select({
      productId: orderItems.productId,
      soldCount: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(sql`${orders.status} = 'pesanan_selesai' and ${orderItems.productId} is not null`)
    .groupBy(orderItems.productId);
  const products = catalog.collection<{ _id: string } & Record<string, unknown>>('products');
  for (const row of sold) {
    if (row.productId) await products.updateOne({ _id: row.productId }, { $set: { soldCount: row.soldCount } });
  }
}

async function seed(dbs: Dbs) {
  await Promise.all([wipePostgres(dbs.identity), wipePostgres(dbs.commerce)]);
  await Promise.all(CATALOG_COLLECTIONS.map((name) => dbs.catalog.collection(name).deleteMany({})));

  const userMap = await seedUsers(dbs);
  const displayNames = new Map(
    rawUsers.flatMap((u) => {
      const id = userMap.get(u.username);
      return id ? [[id, u.name ?? u.username] as const] : [];
    }),
  );

  await seedWallets(dbs, userMap);
  const storeMap = await seedStores(dbs, userMap);
  const productMap = await seedProducts(dbs, storeMap);
  const { voucherMap, promoMap } = await seedDiscounts(dbs);
  const orderMap = await seedOrders(dbs, userMap, storeMap, productMap, voucherMap, promoMap);
  await seedDelivery(dbs, orderMap, userMap);
  await seedReviews(dbs, displayNames, productMap, orderMap);
  await seedCarts(dbs, userMap, productMap, storeMap);
  await dbs.commerce.insert(systemTimeOffset).values({ id: 1, offsetSeconds: 0 }).onConflictDoNothing();
  await syncSoldCounts(dbs);
}

/**
 * The seed bypasses catalog's outbox, so the search index is rebuilt from scratch. The seed is a
 * client of its own (`seed`, scope `search:reindex`), found through Consul like any service.
 */
async function rebuildSearchIndex() {
  if (!env.CONSUL_HTTP_ADDR || !env.SEED_CLIENT_SECRET) {
    console.log('CONSUL_HTTP_ADDR / SEED_CLIENT_SECRET not set: rebuild the index with POST /search/reindex.');
    return;
  }
  const resolver = createResolver(env.CONSUL_HTTP_ADDR);
  const search = createInternalClient({
    service: 'search',
    resolver,
    tokens: createServiceTokenProvider({
      identityUrl: () => resolver.resolve('identity'),
      clientId: 'seed',
      clientSecret: env.SEED_CLIENT_SECRET,
    }),
    scope: 'search:reindex',
    timeoutMs: 120_000,
  });
  const result = await search.post('/search/reindex', z.object({ documents: z.number() }));
  console.log(`Search index rebuilt: ${result.documents} documents.`);
}

const { identity, commerce, catalog } = connections;
let exitCode = 0;
try {
  console.log('Seeding identity (Postgres), catalog (MongoDB) and commerce (Postgres)...');
  await catalog.connect();
  // One transaction per Postgres database; a failure rolls both back (catalog is wiped again on rerun).
  await identity.db.transaction((identityTx) =>
    commerce.db.transaction((commerceTx) =>
      seed({ identity: identityTx, commerce: commerceTx, catalog: catalog.db() }),
    ),
  );
  console.log('Seed complete.');
  await rebuildSearchIndex();
} catch (error) {
  console.error('Seeding failed:', error);
  exitCode = 1;
} finally {
  await Promise.all([identity.client.end(), commerce.client.end(), catalog.close()]);
}
process.exit(exitCode);
