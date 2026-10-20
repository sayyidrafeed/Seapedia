/**
 * Builds the public API contract: merges identity, catalog and commerce `/openapi.json` into
 * apps/web/public/openapi.json, which the web SDK is generated from and /docs renders. Kong does
 * not merge specs, so this runs whenever a service's public API changes (services must be up).
 *
 *   bun scripts/openapi.ts                       # finds services through Consul (localhost:8500)
 *   bun scripts/openapi.ts http://localhost:4001 http://localhost:4002 http://localhost:4003
 */
const SERVICES = ['identity', 'catalog', 'commerce'] as const;
const PUBLIC_URL = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
const consul = process.env.CONSUL_HTTP_ADDR ?? 'http://localhost:8500';

type Spec = { paths?: Record<string, unknown>; components?: { schemas?: Record<string, unknown> } };

async function baseUrl(service: string, index: number) {
  const explicit = process.argv[2 + index];
  if (explicit) return explicit;
  const res = await fetch(`${consul}/v1/health/service/${service}?passing=true`);
  const [entry] = (await res.json()) as { Service: { Address: string; Port: number } }[];
  if (!entry) throw new Error(`${service} is not registered in Consul`);
  return `http://${entry.Service.Address}:${entry.Service.Port}`;
}

const paths: Record<string, unknown> = {};
const schemas: Record<string, unknown> = {};
const owner = new Map<string, string>();

for (const [index, service] of SERVICES.entries()) {
  const res = await fetch(`${await baseUrl(service, index)}/openapi.json`);
  if (!res.ok) throw new Error(`${service} /openapi.json -> ${res.status}`);
  const spec = (await res.json()) as Spec;
  if (typeof spec !== 'object' || spec === null) throw new Error(`${service} returned no OpenAPI document`);

  // Two services defining the same path, or one schema name with different shapes, is a contract bug.
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    if (path in paths) throw new Error(`path ${path} defined by ${owner.get(path)} and ${service}`);
    paths[path] = item;
    owner.set(path, service);
  }
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    if (name in schemas && JSON.stringify(schemas[name]) !== JSON.stringify(schema)) {
      throw new Error(`schema ${name} differs between ${owner.get(`#${name}`)} and ${service}`);
    }
    schemas[name] = schema;
    owner.set(`#${name}`, service);
  }
}

const contract = {
  openapi: '3.0.0',
  info: {
    title: 'Seapedia API',
    version: '1.0.0',
    description: 'Public API behind Kong: identity, catalog and commerce. Authenticate with the __access cookie.',
  },
  servers: [{ url: PUBLIC_URL }],
  paths: Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b))),
  components: {
    schemas: Object.fromEntries(Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b))),
    securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: '__access' } },
  },
};

await Bun.write('apps/web/public/openapi.json', `${JSON.stringify(contract, null, 2)}\n`);
console.log(`apps/web/public/openapi.json: ${Object.keys(paths).length} paths, ${Object.keys(schemas).length} schemas`);
