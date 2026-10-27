import { z } from 'zod';

// `config/shared/*`, read once at boot: the relay and consumers are built with these values.
export const sharedConfigSchema = z.object({
  outboxIntervalMs: z.number().int().min(100).default(500),
  consumerPrefetch: z.number().int().min(1).max(500).default(20),
});
const RESTART_REQUIRED = Object.keys(sharedConfigSchema.shape);

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

// An invalid KV change is rejected and the last valid config stays; read via get() to follow changes.
// Shared keys keep their boot value until restart.
export async function loadConfig<S extends z.ZodType<Record<string, unknown>>>(options: {
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
          const next: Record<string, unknown> = { ...result.data };
          const previous: Record<string, unknown> = current;
          const pending = RESTART_REQUIRED.filter((key) => next[key] !== previous[key]);
          for (const key of pending) next[key] = previous[key];
          if (pending.length > 0) {
            console.warn(
              JSON.stringify({ service, event: 'config_restart_required', keys: pending }),
            );
          }
          current = next as z.infer<S>;
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

// Config for unit tests and tools: schema defaults, no Consul.
export function staticConfig<S extends z.ZodType>(schema: S, values: Record<string, unknown> = {}) {
  const value: z.infer<S> = schema.parse(values);
  return { get: () => value, stop: () => undefined };
}
