import { env } from '@/env';
import { elastic } from './client';
import { productIndexSettings, productMappings, storeMappings } from './mapping';

export const alias = env.INDEX_ALIAS;

export async function aliasExists() {
  return await elastic.indices.existsAlias({ name: alias });
}

export async function createIndex() {
  const index = `${alias}_${Date.now()}`;
  await elastic.indices.create({
    index,
    settings: productIndexSettings,
    mappings: productMappings,
  });
  return index;
}

/** Points the alias at `index` in one atomic step and drops the indices it replaced. */
export async function swapAlias(index: string) {
  const current = (await aliasExists())
    ? Object.keys(await elastic.indices.getAlias({ name: alias }))
    : [];

  await elastic.indices.updateAliases({
    actions: [
      ...current.map((old) => ({ remove: { index: old, alias } })),
      { add: { index, alias, is_write_index: true } },
    ],
  });

  const stale = current.filter((old) => old !== index);
  if (stale.length > 0) await elastic.indices.delete({ index: stale });
}

export const storesIndex = `${alias}_stores`;

/** The small store lookup index (not rebuilt by reindex swaps, only upserted). */
export async function ensureStoresIndex() {
  if (await elastic.indices.exists({ index: storesIndex })) return;
  await elastic.indices.create({
    index: storesIndex,
    settings: productIndexSettings,
    mappings: storeMappings,
  });
}
