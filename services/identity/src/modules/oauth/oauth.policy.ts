// Single source of who may call whom; callees enforce the scope with requireServiceScope.
export const SERVICE_POLICY: Record<string, Record<string, string[]>> = {
  catalog: { search: ['search:query'] },
  search: { catalog: ['catalog:export'] },
  seed: { search: ['search:reindex'] },
};
