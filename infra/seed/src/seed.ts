import { sql } from 'drizzle-orm';
import { connections, type Dbs, type Tx } from './dbs';
import { inventory, orderItems, orders, products, systemTimeOffset } from './schema';
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

/** Seeding starts clean: every service table is emptied (migration history is untouched). */
async function wipe(tx: Tx) {
  const tables = await tx.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (tables.length === 0) return;
  const names = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await tx.execute(sql.raw(`truncate table ${names} restart identity cascade`));
}

/**
 * Catalog shows read models of commerce data (stock, sold counts). At runtime the outbox keeps
 * them in step; the seed writes them directly from commerce's final state.
 */
async function syncReadModels({ catalog, commerce }: Dbs) {
  const stock = await commerce.select().from(inventory);
  for (const row of stock) {
    await catalog
      .update(products)
      .set({ stock: row.stock })
      .where(sql`${products.id} = ${row.productId}`);
  }

  const sold = await commerce
    .select({
      productId: orderItems.productId,
      soldCount: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(sql`${orders.status} = 'pesanan_selesai' and ${orderItems.productId} is not null`)
    .groupBy(orderItems.productId);
  for (const row of sold) {
    await catalog
      .update(products)
      .set({ soldCount: row.soldCount })
      .where(sql`${products.id} = ${row.productId}`);
  }
}

async function seed(dbs: Dbs) {
  await Promise.all([wipe(dbs.identity), wipe(dbs.catalog), wipe(dbs.commerce)]);

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
  await dbs.commerce
    .insert(systemTimeOffset)
    .values({ id: 1, offsetSeconds: 0 })
    .onConflictDoNothing();
  await syncReadModels(dbs);
}

/** The seed bypasses catalog's outbox, so the search index is rebuilt from scratch. */
async function rebuildSearchIndex() {
  const url = process.env.SEARCH_REINDEX_URL;
  if (!url) {
    console.log('SEARCH_REINDEX_URL not set: rebuild the search index with POST /search/reindex.');
    return;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.INTERNAL_API_TOKEN ?? ''}` },
  });
  if (!res.ok) throw new Error(`search reindex failed: ${res.status} ${await res.text()}`);
  console.log('Search index rebuilt:', await res.text());
}

const { identity, catalog, commerce } = connections;
let exitCode = 0;
try {
  console.log('Seeding identity, catalog and commerce databases...');
  // Nested transactions, one per database: a failure anywhere rolls back all three.
  await identity.db.transaction((identityTx) =>
    catalog.db.transaction((catalogTx) =>
      commerce.db.transaction((commerceTx) =>
        seed({ identity: identityTx, catalog: catalogTx, commerce: commerceTx }),
      ),
    ),
  );
  console.log('Seed complete.');
  await rebuildSearchIndex();
} catch (error) {
  console.error('Seeding failed:', error);
  exitCode = 1;
} finally {
  await Promise.all([identity.client.end(), catalog.client.end(), commerce.client.end()]);
}
process.exit(exitCode);
