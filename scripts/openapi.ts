// Kong does not merge specs. Each service's app is loaded offline with its test environment (no
// databases, Consul or RabbitMQ), so this runs in CI and fails when the committed contract is stale.
const SERVICES = ['identity', 'catalog', 'commerce'] as const;
const PUBLIC_URL = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

type Spec = { paths?: Record<string, unknown>; components?: { schemas?: Record<string, unknown> } };

async function specOf(service: string): Promise<Spec> {
  const proc = Bun.spawn(
    [
      'bun',
      '--preload',
      './test/setup.ts',
      '-e',
      "const { app } = await import('./src/app.ts'); const r = await app.request('/openapi.json'); process.stdout.write(await r.text()); process.exit(r.ok ? 0 : 1);",
    ],
    { cwd: `services/${service}`, env: { ...process.env, NODE_ENV: 'test' }, stderr: 'inherit' },
  );
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) throw new Error(`${service}: could not build its OpenAPI document`);
  return JSON.parse(out) as Spec;
}

const paths: Record<string, unknown> = {};
const schemas: Record<string, unknown> = {};
const owner = new Map<string, string>();

for (const service of SERVICES) {
  const spec = await specOf(service);

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
