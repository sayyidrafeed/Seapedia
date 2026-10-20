/**
 * Which service may call which, with what scopes. identity is the single place this is decided;
 * callees enforce the scope on each internal route (`requireServiceScope`).
 */
export const SERVICE_POLICY: Record<string, Record<string, string[]>> = {
  catalog: { search: ['search:query'] },
  search: { catalog: ['catalog:export'] },
  seed: { search: ['search:reindex'] },
};
