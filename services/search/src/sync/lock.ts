let tail: Promise<unknown> = Promise.resolve();

// Sync batches and reindexes never interleave, so a swapped-in index cannot miss a change.
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.catch(() => undefined);
  return run;
}
