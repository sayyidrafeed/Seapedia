import { networkInterfaces } from 'node:os';

type HealthEntry = {
  Service: { Address: string; Port: number; ID: string };
  Node: { Address: string };
};

function firstPrivateIPv4() {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) if (a.family === 'IPv4' && !a.internal) return a.address;
  }
  return '127.0.0.1';
}

// Consul drops an instance whose health check stays critical for a minute (crash, OOM kill).
export async function registerService(options: {
  consulUrl: string;
  name: string;
  port: number;
  // Address other containers reach this instance on. Defaults to the container's IP.
  address?: string;
  healthPath?: string;
}) {
  const address = options.address ?? firstPrivateIPv4();
  const id = `${options.name}-${address}-${options.port}`;
  const body = {
    ID: id,
    Name: options.name,
    Address: address,
    Port: options.port,
    Check: {
      HTTP: `http://${address}:${options.port}${options.healthPath ?? '/health'}`,
      Interval: '5s',
      Timeout: '2s',
      DeregisterCriticalServiceAfter: '1m',
    },
  };

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(new URL('/v1/agent/service/register', options.consulUrl), {
        method: 'PUT',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`consul register: ${res.status} ${await res.text()}`);
      break;
    } catch (error) {
      if (attempt >= 20) throw error;
      await Bun.sleep(1500);
    }
  }

  const deregister = async () => {
    await fetch(new URL(`/v1/agent/service/deregister/${id}`, options.consulUrl), {
      method: 'PUT',
      signal: AbortSignal.timeout(2000),
    }).catch(() => undefined);
  };
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => void deregister().finally(() => process.exit(0)));
  }
  return { id, address, deregister };
}

// Client-side discovery: healthy instances from Consul, cached briefly, picked round-robin.
export function createResolver(consulUrl: string, cacheMs = 10_000) {
  const cache = new Map<string, { urls: string[]; at: number; cursor: number }>();

  async function instances(name: string) {
    const hit = cache.get(name);
    if (hit && Date.now() - hit.at < cacheMs && hit.urls.length > 0) return hit;
    const res = await fetch(new URL(`/v1/health/service/${name}?passing=true`, consulUrl), {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`consul health ${name}: ${res.status}`);
    const urls = ((await res.json()) as HealthEntry[]).map(
      (e) => `http://${e.Service.Address || e.Node.Address}:${e.Service.Port}`,
    );
    const entry = { urls, at: Date.now(), cursor: hit?.cursor ?? 0 };
    cache.set(name, entry);
    return entry;
  }

  return {
    // Base URL of the next healthy instance.
    async resolve(name: string): Promise<string> {
      const entry = await instances(name);
      if (entry.urls.length === 0) throw new Error(`no healthy instance of ${name}`);
      const url = entry.urls[entry.cursor % entry.urls.length];
      entry.cursor++;
      return url;
    },
    // How many healthy instances are known (for retrying each once).
    async count(name: string) {
      return (await instances(name)).urls.length;
    },
    invalidate(name: string) {
      cache.delete(name);
    },
  };
}

export type Resolver = ReturnType<typeof createResolver>;
