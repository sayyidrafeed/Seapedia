import { env } from '@/env';
import { elastic } from './client';
import { productIndexSettings, productMappings, storeMappings } from './mapping';

export const alias = env.INDEX_ALIAS;
// Points at the index a rebuild is filling; every instance's writers also apply events there.
export const buildingAlias = `${alias}_building`;
// One lease document is the cluster-wide rebuild lock, shared by every search instance.
const leaseIndex = `${alias}_rebuild_lease`;
const LEASE_ID = 'rebuild';
const LEASE_MS = 10 * 60_000;

type Lease = { owner: string; index: string | null; expiresAt: number };
type Held = { owner: string; seq: number; term: number };

export async function aliasExists() {
  return await elastic.indices.existsAlias({ name: alias });
}

// The new index is visible to writers (via buildingAlias) before the export starts, so an event
// applied after that lands in both indices and one applied before it is already in catalog's data.
export const newIndexName = () => `${alias}_${Date.now()}`;

export async function createIndex(index: string) {
  await elastic.indices.create({
    index,
    settings: productIndexSettings,
    mappings: productMappings,
    aliases: { [buildingAlias]: {} },
  });
}

async function ensureLeaseIndex() {
  await elastic.indices
    .create({ index: leaseIndex, settings: { number_of_replicas: 0 } })
    .catch((error) => {
      if (!String(error).includes('resource_already_exists_exception')) throw error;
    });
}

// Every write is conditional on the sequence number we last saw, so only the holder can change
// or drop its lease, and only one instance can take over an expired one.
async function writeLease(lease: Lease, held?: Held): Promise<Held | null> {
  try {
    const res = await elastic.index({
      index: leaseIndex,
      id: LEASE_ID,
      document: lease,
      refresh: false,
      ...(held ? { if_seq_no: held.seq, if_primary_term: held.term } : { op_type: 'create' }),
    });
    return { owner: lease.owner, seq: res._seq_no ?? 0, term: res._primary_term ?? 0 };
  } catch (error) {
    if (String(error).includes('version_conflict_engine_exception')) return null;
    throw error;
  }
}

// Null when another instance holds a live lease. An expired lease belongs to a crashed rebuild:
// it is taken over, and only the index that lease recorded is dropped.
export async function acquireRebuildLease(): Promise<Held | null> {
  await ensureLeaseIndex();
  const owner = crypto.randomUUID();
  const fresh = { owner, index: null, expiresAt: Date.now() + LEASE_MS };
  const created = await writeLease(fresh);
  if (created) return created;

  const current = await elastic.get<Lease>({ index: leaseIndex, id: LEASE_ID }, { ignore: [404] });
  if (!current.found || !current._source) return null;
  if (current._source.expiresAt > Date.now()) return null;
  const taken = await writeLease(fresh, {
    owner: current._source.owner,
    seq: current._seq_no ?? 0,
    term: current._primary_term ?? 0,
  });
  if (taken && current._source.index) {
    await elastic.indices.delete({ index: current._source.index }, { ignore: [404] });
  }
  return taken;
}

// Records the index being built and extends the lease; null means the lease was lost.
export function renewRebuildLease(held: Held, index: string) {
  return writeLease({ owner: held.owner, index, expiresAt: Date.now() + LEASE_MS }, held);
}

export async function releaseRebuildLease(held: Held) {
  await elastic.delete(
    { index: leaseIndex, id: LEASE_ID, if_seq_no: held.seq, if_primary_term: held.term },
    { ignore: [404, 409] },
  );
}

// Points the alias at `index` in one atomic step and drops the indices it replaced.
export async function swapAlias(index: string) {
  const current = (await aliasExists())
    ? Object.keys(await elastic.indices.getAlias({ name: alias }))
    : [];

  await elastic.indices.updateAliases({
    actions: [
      ...current.map((old) => ({ remove: { index: old, alias } })),
      { remove: { index, alias: buildingAlias } },
      { add: { index, alias, is_write_index: true } },
    ],
  });

  const stale = current.filter((old) => old !== index);
  if (stale.length > 0) await elastic.indices.delete({ index: stale });
}

export const storesIndex = `${alias}_stores`;

// The small store lookup index (not rebuilt by reindex swaps, only upserted).
export async function ensureStoresIndex() {
  if (await elastic.indices.exists({ index: storesIndex })) return;
  await elastic.indices.create({
    index: storesIndex,
    settings: productIndexSettings,
    mappings: storeMappings,
  });
}
