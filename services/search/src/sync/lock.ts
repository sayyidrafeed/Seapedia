let tail: Promise<unknown> = Promise.resolve();

/**
 * Serializes index writers: incremental sync batches and full reindexes never interleave, so a
 * reindex cannot swap in an index that misses a concurrently applied change.
 */
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.catch(() => undefined);
  return run;
}
