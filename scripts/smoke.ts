/**
 * Manual end-to-end check through Kong against the production-like stack with seed data:
 * edge and service auth, token rotation and revocation, choreography across services, scoped
 * service-to-service calls, broker permissions, Consul configuration and discovery.
 *
 *   bun scripts/smoke.ts                 # API_URL defaults to http://localhost:3001
 *   bun scripts/smoke.ts --resilience    # also stops RabbitMQ, Elasticsearch, catalog, a search replica
 *
 * Not part of CI: it mutates data and needs the whole stack (docker-compose.prod.yml).
 */
const API = process.env.API_URL ?? 'http://localhost:3001';
const CONSUL = process.env.CONSUL_HTTP_ADDR ?? 'http://localhost:8500';
const COMPOSE = ['docker', 'compose', '-f', 'docker-compose.prod.yml', '--env-file', '.env.prod.local'];
const PASSWORD = 'password123';

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : `  -> ${JSON.stringify(detail)}`}`);
  if (!ok) failures++;
}

class Session {
  cookies = new Map<string, string>();
  constructor(readonly label: string) {}

  get cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async call(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(this.cookies.size ? { cookie: this.cookieHeader } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(';');
      const [name, value] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    const text = await res.text();
    let json: unknown = text;
    try {
      json = JSON.parse(text);
    } catch {
      // plain-text error bodies stay as text
    }
    return { status: res.status, json: json as Record<string, unknown> & unknown[] };
  }

  async login(username: string) {
    const res = await this.call('POST', '/api/auth/login', { username, password: PASSWORD });
    if (res.status !== 200) throw new Error(`${this.label} login failed: ${res.status} ${JSON.stringify(res.json)}`);
    return this;
  }

  async role(role: string) {
    await this.call('POST', '/api/auth/select-role', { role });
    return this;
  }
}

/** Replication through events is eventually consistent: poll. */
async function eventually(probe: () => Promise<boolean>, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe().catch(() => false)) return true;
    await Bun.sleep(500);
  }
  return false;
}

async function compose(...args: string[]) {
  const proc = Bun.spawn([...COMPOSE, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [out, code] = [await new Response(proc.stdout).text(), await proc.exited];
  if (code !== 0) throw new Error(`docker compose ${args.join(' ')} failed: ${await new Response(proc.stderr).text()}`);
  return out;
}

/** Runs a snippet with Bun inside a container on the private network. */
const inContainer = (service: string, workdir: string, code: string) =>
  compose('exec', '-T', '-w', workdir, service, 'bun', '-e', code).then((out) => out.trim());

const anon = new Session('anon');
const searchFor = async (q: string) =>
  (await anon.call('GET', `/api/products?search=${encodeURIComponent(q)}&limit=50`)).json as unknown as {
    products: { id: string; name: string; stock: number; soldCount: number }[];
    total: number;
  };
const productById = async (id: string) =>
  (await anon.call('GET', `/api/products/${id}`)).json as { stock?: number; soldCount?: number; name?: string };

// ── Edge ──────────────────────────────────────────────────────────────────────
check('Kong rejects a protected route without a token', (await anon.call('GET', '/api/orders')).status === 401);
const forged =
  'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJzZWFwZWRpYS1pZGVudGl0eSIsInN1YiI6IngiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.c2lnbmF0dXJl';
check(
  'Kong rejects a forged token',
  (await anon.call('GET', '/api/admin/dashboard', undefined, { cookie: `__access=${forged}` })).status === 401,
);
check('public catalog browsing needs no token', (await anon.call('GET', '/api/products?limit=1')).status === 200);

// ── Tokens: rotation, reuse detection, revocation ────────────────────────────
const probe = await new Session('probe').login('sari_dewi');
const firstRefresh = probe.cookies.get('__refresh')!;
const rotated = await probe.call('POST', '/api/auth/refresh');
check('refresh rotates the pair', rotated.status === 200 && probe.cookies.get('__refresh') !== firstRefresh);
check('the new access token works', (await probe.call('GET', '/api/auth/me')).status === 200);

const replay = new Session('replay');
replay.cookies.set('__refresh', firstRefresh);
check('replaying a used refresh token is refused', (await replay.call('POST', '/api/auth/refresh')).status === 401);
check(
  'the replay revokes the session everywhere (denylist via event)',
  await eventually(async () => (await probe.call('GET', '/api/orders')).status === 401, 10_000),
);

// ── Seller: product → commerce + search (choreography) ───────────────────────
const seller = await (await new Session('seller').login('budi_santoso')).role('seller');
const marker = `smoke${Date.now().toString(36)}`;
const created = await seller.call('POST', '/api/seller/products', {
  name: `Kerupuk Udang ${marker}`,
  description: 'Produk uji smoke test',
  price: 25_000,
});
const productId = String(created.json.id ?? '');
check('seller creates a product (catalog, MongoDB)', created.status === 200 && productId !== '', created.json);

let stockStatus = 0;
await eventually(async () => {
  stockStatus = (await seller.call('PUT', `/api/seller/inventory/${productId}`, { stock: 7 })).status;
  return stockStatus === 200;
});
check('commerce learns the product from its event, then accepts stock', stockStatus === 200, stockStatus);
check(
  'the product becomes searchable (catalog event -> search)',
  await eventually(async () => (await searchFor(marker)).products.some((p) => p.id === productId)),
);
check('catalog shows the stock (commerce event -> catalog)', await eventually(async () => (await productById(productId)).stock === 7));

// ── Buyer checkout, delivery, review gate ────────────────────────────────────
const buyer = await new Session('buyer').login('dewi_lestari');
await buyer.call('DELETE', '/api/buyers/cart');
check('buyer adds it to the cart', (await buyer.call('POST', '/api/buyers/cart/items', { productId, quantity: 2 })).status === 200);
const addresses = (await buyer.call('GET', '/api/buyers/addresses')).json as unknown as { id: string }[];
const order = await buyer.call('POST', '/api/orders', { deliveryMethod: 'instant', addressId: addresses[0]?.id });
const orderId = String(order.json.id ?? '');
check('checkout succeeds in one commerce transaction', order.status === 200 && orderId !== '', order.json);
check('stock drops in catalog', await eventually(async () => (await productById(productId)).stock === 5));
check(
  'no review before the order is completed',
  (await buyer.call('POST', `/api/products/${productId}/reviews`, { rating: 5, comment: 'Mantap sekali' })).status === 403,
);

check('seller processes the order', (await seller.call('POST', `/api/seller/orders/${orderId}/process`, {})).status === 200);
const driver = await new Session('driver').login('joko_widodo');
const jobs = (await driver.call('GET', '/api/driver/jobs')).json as unknown as { id: string; orderId: string }[];
const job = Array.isArray(jobs) ? jobs.find((j) => j.orderId === orderId) : undefined;
await driver.call('POST', `/api/driver/jobs/${job?.id}/take`);
check('driver completes the delivery', (await driver.call('POST', `/api/driver/jobs/${job?.id}/complete`)).status === 200);

check('sold count reaches catalog (order.completed)', await eventually(async () => (await productById(productId)).soldCount === 2));
let review = { status: 0, json: {} as Record<string, unknown> };
await eventually(async () => {
  review = await buyer.call('POST', `/api/products/${productId}/reviews`, { rating: 5, comment: 'Mantap sekali' });
  return review.status === 201;
});
check(
  'review allowed from the purchase replica, with the replicated name',
  review.status === 201 && review.json.reviewerName === 'Dewi Lestari',
  review.json,
);

// ── Admin dashboard from replicas ────────────────────────────────────────────
const admin = await new Session('admin').login('admin');
const dashboard = await admin.call('GET', '/api/admin/dashboard');
const stats = dashboard.json as { users?: { total: number }; products?: { total: number } };
check(
  'admin dashboard counts users and products from replicas',
  dashboard.status === 200 && (stats.users?.total ?? 0) > 0 && (stats.products?.total ?? 0) > 0,
  dashboard.json,
);

// ── Delete propagates ─────────────────────────────────────────────────────────
check('seller deletes the product', (await seller.call('DELETE', `/api/seller/products/${productId}`)).status === 200);
check(
  'it leaves the search index (tombstone)',
  await eventually(async () => !(await searchFor(marker)).products.some((p) => p.id === productId)),
);
check(
  'commerce drops its replica (cart refuses it)',
  await eventually(async () => (await buyer.call('POST', '/api/buyers/cart/items', { productId, quantity: 1 })).status === 409),
);

// ── Logout ────────────────────────────────────────────────────────────────────
const staleAccess = buyer.cookies.get('__access')!;
await buyer.call('POST', '/api/auth/logout');
check(
  'a logged-out access token is refused by services (denylist)',
  await eventually(async () => (await anon.call('GET', '/api/orders', undefined, { cookie: `__access=${staleAccess}` })).status === 401, 10_000),
);

// ── Service-to-service and broker permissions ─────────────────────────────────
const unauthenticated = await inContainer(
  'catalog',
  '/repo/services/catalog',
  `const r = await fetch('http://search:4004/search/products?q=x'); console.log(r.status)`,
).catch(() => 'n/a');
check('search refuses calls without a service token', unauthenticated === '401', unauthenticated);

const forgedEvent = await inContainer(
  'catalog',
  '/repo/packages/platform',
  `import { connect } from 'amqplib';
   const conn = await connect(process.env.RABBITMQ_URL);
   const ch = await conn.createConfirmChannel();
   let outcome = 'published';
   ch.on('error', (e) => { outcome = String(e.message).includes('ACCESS_REFUSED') ? 'refused' : String(e.message); });
   ch.publish('seapedia.events', 'identity.user.updated', Buffer.from('{}'));
   await ch.waitForConfirms().catch(() => {});
   await Bun.sleep(300);
   console.log(outcome);
   process.exit(0);`,
).catch((e) => String(e));
check("catalog cannot publish identity's events (topic permission)", forgedEvent.endsWith('refused'), forgedEvent);

// ── Consul configuration (hot reload) ─────────────────────────────────────────
// putri_anggraini has a seeded cart, so the checkout preview includes a delivery fee.
const feeBuyer = await new Session('fee').login('putri_anggraini');
const feeFor = async () =>
  ((await feeBuyer.call('POST', '/api/orders/preview', { deliveryMethod: 'instant' })).json as { deliveryFee?: number })
    .deliveryFee;
const feeBefore = await feeFor();
await compose('exec', '-T', 'consul', 'consul', 'kv', 'put', 'config/commerce/deliveryFees', '{"instant":35000,"next_day":15000,"regular":10000}');
const reloaded = await eventually(async () => (await feeFor()) === 35000);
await compose('exec', '-T', 'consul', 'consul', 'kv', 'put', 'config/commerce/deliveryFees', '{"instant":30000,"next_day":15000,"regular":10000}');
check('a Consul config change applies without a restart (delivery fee)', feeBefore === 30000 && reloaded, feeBefore);

// ── Degraded modes and discovery ─────────────────────────────────────────────
if (process.argv.includes('--resilience')) {
  const consulPassing = async (svc: string) =>
    ((await (await fetch(`${CONSUL}/v1/health/service/${svc}?passing=true`)).json()) as unknown[]).length;

  await compose('up', '-d', '--scale', 'search=2', 'search');
  check('a second search instance registers in Consul', await eventually(async () => (await consulPassing('search')) === 2, 60_000));
  const searchContainers = (await compose('ps', '-q', 'search')).trim().split('\n');
  await Bun.spawn(['docker', 'stop', searchContainers[0]]).exited;
  const since = new Date().toISOString();
  const stillRanked = (await searchFor('samsung')).total > 0;
  const fellBack = (await compose('logs', '--since', since, 'catalog')).includes('search_fallback');
  check('search keeps answering from the other instance (client-side discovery)', stillRanked && !fellBack);
  await compose('up', '-d', '--scale', 'search=1', 'search');

  await compose('stop', 'rabbitmq');
  const sellerWhileDown = await seller.call('POST', '/api/seller/products', { name: `Saat Broker Mati ${marker}`, price: 1000 });
  check('writes still succeed while RabbitMQ is down (outbox)', sellerWhileDown.status === 200, sellerWhileDown.json);
  await compose('start', 'rabbitmq');
  check(
    'the queued event is delivered once RabbitMQ is back',
    await eventually(async () => (await searchFor(`Broker Mati ${marker}`)).total > 0, 90_000),
  );

  await compose('stop', 'elasticsearch');
  check('search falls back to MongoDB when Elasticsearch is down', (await searchFor('samsung')).total > 0);
  await compose('start', 'elasticsearch');

  const historyBuyer = await new Session('history').login('putri_anggraini');
  await compose('stop', 'catalog');
  check('order history works while catalog is down', (await historyBuyer.call('GET', '/api/orders')).status === 200);
  await compose('start', 'catalog');
}

console.log(failures === 0 ? '\nAll smoke checks passed.' : `\n${failures} smoke check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
