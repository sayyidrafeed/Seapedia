import type { z } from 'zod';

type KvEntry = { Key: string; Value: string | null };

async function readPrefix(consulUrl: string, prefix: string, index?: string) {
  const url = new URL(`/v1/kv/${prefix}`, consulUrl);
  url.searchParams.set('recurse', 'true');
  if (index) {
    url.searchParams.set('index', index);
    url.searchParams.set('wait', '5m');
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(index ? 6 * 60_000 : 5000) });
  const nextIndex = res.headers.get('x-consul-index') ?? index ?? '0';
  if (res.status === 404) return { values: {}, index: nextIndex };
  if (!res.ok) throw new Error(`consul kv ${prefix}: ${res.status}`);
  const values: Record<string, unknown> = {};
  for (const entry of (await res.json()) as KvEntry[]) {
    const name = entry.Key.slice(prefix.length).replace(/^\//, '');
    if (!name || entry.Value === null) continue;
    const raw = Buffer.from(entry.Value, 'base64').toString('utf8');
    try {
      values[name] = JSON.parse(raw);
    } catch {
      values[name] = raw;
    }
  }
  return { values, index: nextIndex };
}

/**
 * Centralized, non-secret configuration from Consul KV: `config/shared/<key>` overridden by
 * `config/<service>/<key>`. Values are JSON. The result is validated by the service's schema;
 * an invalid change is rejected and the last good config stays active.
 *
 * Read values through `get()` at use time and they follow changes without a restart
 * (blocking-query watch). Secrets never live here: they come from the environment.
 */
export async function loadConfig<S extends z.ZodType>(options: {
  consulUrl: string;
  service: string;
  schema: S;
  onChange?: (config: z.infer<S>) => void;
}): Promise<{ get: () => z.infer<S>; stop: () => void }> {
  const { consulUrl, service, schema } = options;
  const prefixes = ['config/shared', `config/${service}`] as const;
  const indexes: Record<string, string> = {};
  const layers: Record<string, Record<string, unknown>> = {};

  async function fetchLayer(prefix: string, wait: boolean) {
    const { values, index } = await readPrefix(
      consulUrl,
      prefix,
      wait ? indexes[prefix] : undefined,
    );
    const changed = indexes[prefix] !== index;
    indexes[prefix] = index;
    layers[prefix] = values;
    return changed;
  }

  // Consul may still be starting alongside the service: retry for a while, then fail fast.
  for (let attempt = 1; ; attempt++) {
    try {
      for (const prefix of prefixes) await fetchLayer(prefix, false);
      break;
    } catch (error) {
      if (attempt >= 20) throw error;
      await Bun.sleep(1500);
    }
  }

  const merge = () => schema.parse({ ...layers['config/shared'], ...layers[`config/${service}`] });
  let current: z.infer<S> = merge();
  let stopped = false;

  for (const prefix of prefixes) {
    void (async () => {
      while (!stopped) {
        try {
          if (!(await fetchLayer(prefix, true))) continue;
          const result = schema.safeParse({
            ...layers['config/shared'],
            ...layers[`config/${service}`],
          });
          if (!result.success) {
            console.error(
              JSON.stringify({ service, event: 'config_rejected', issues: result.error.issues }),
            );
            continue;
          }
          current = result.data;
          console.log(JSON.stringify({ service, event: 'config_reloaded' }));
          options.onChange?.(current);
        } catch (error) {
          console.error(
            JSON.stringify({ service, event: 'config_watch_failed', error: String(error) }),
          );
          await Bun.sleep(5000);
        }
      }
    })();
  }

  return {
    get: () => current,
    stop: () => {
      stopped = true;
    },
  };
}

/** Config for unit tests and tools: schema defaults, no Consul. */
export function staticConfig<S extends z.ZodType>(schema: S, values: Record<string, unknown> = {}) {
  const value: z.infer<S> = schema.parse(values);
  return { get: () => value, stop: () => undefined };
}
