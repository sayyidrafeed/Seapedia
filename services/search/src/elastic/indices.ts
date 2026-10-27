import { env } from '@/env';
import { elastic } from './client';
import { productIndexSettings, productMappings, storeMappings } from './mapping';

export const alias = env.INDEX_ALIAS;
// Points at the index a rebuild is filling; every instance's writers also apply events there.
export const buildingAlias = `${alias}_building`;
// Its existence is the cluster-wide rebuild lock, shared by every search instance.
const lockIndex = `${alias}_rebuild_lock`;
const STALE_LOCK_MS = 30 * 60_000;

export async function aliasExists() {
  return await elastic.indices.existsAlias({ name: alias });
}

// The new index is visible to writers (via buildingAlias) before the export starts, so an event
// applied after that lands in both indices and one applied before it is already in catalog's data.
export async function createIndex() {
  const index = `${alias}_${Date.now()}`;
  await elastic.indices.create({
    index,
    settings: productIndexSettings,
    mappings: productMappings,
    aliases: { [buildingAlias]: {} },
  });
  return index;
}

const lockIsFresh = async () => {
  const settings = await elastic.indices.getSettings({ index: lockIndex });
  const created = Number(settings[lockIndex]?.settings?.index?.creation_date ?? 0);
  return Date.now() - created < STALE_LOCK_MS;
};

// False when another instance is rebuilding. A lock older than 30 minutes belongs to a crashed
// rebuild: its half-built index is dropped and the lock taken over.
export async function acquireRebuildLock() {
  try {
    await elastic.indices.create({ index: lockIndex, settings: { number_of_replicas: 0 } });
  } catch (error) {
    if (!String(error).includes('resource_already_exists_exception')) throw error;
    if (await lockIsFresh()) return false;
    await dropBuildingIndex();
    await elastic.indices.delete({ index: lockIndex });
    return acquireRebuildLock();
  }
  await dropBuildingIndex();
  return true;
}

export async function releaseRebuildLock() {
  await elastic.indices.delete({ index: lockIndex }, { ignore: [404] });
}

export async function dropBuildingIndex() {
  if (!(await elastic.indices.existsAlias({ name: buildingAlias }))) return;
  const indices = Object.keys(await elastic.indices.getAlias({ name: buildingAlias }));
  if (indices.length > 0) await elastic.indices.delete({ index: indices });
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
