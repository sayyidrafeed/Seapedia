/**
 * Manual end-to-end smoke test through the gateway, against a running stack with seed data.
 * It exercises the cross-service flows that unit tests cannot: session introspection, outbox
 * replication, search indexing, checkout, delivery, and degraded modes.
 *
 *   bun scripts/smoke.ts                 # API_URL defaults to http://localhost:3001
 *   bun scripts/smoke.ts --resilience    # also stops/starts containers (docker-compose.prod.yml)
 *
 * Not part of CI: it mutates data and needs the whole stack.
 */
const API = process.env.API_URL ?? 'http://localhost:3001';
const COMPOSE = ['docker', 'compose', '-f', 'docker-compose.prod.yml', '--env-file', '.env.prod.local'];
const PASSWORD = 'password123';

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : `  -> ${JSON.stringify(detail)}`}`);
  if (!ok) failures++;
}

class Session {
  cookie = '';
  constructor(readonly label: string) {}

  async call(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
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
    if (res.status !== 200) throw new Error(`${this.label} login failed: ${res.status}`);
    return this;
  }
}

/** Polls until `probe` returns true: replication through the outbox is eventually consistent. */
async function eventually(probe: () => Promise<boolean>, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) return true;
    await Bun.sleep(500);
  }
  return false;
}

async function compose(...args: string[]) {
  const proc = Bun.spawn([...COMPOSE, ...args], { stdout: 'ignore', stderr: 'inherit' });
  if ((await proc.exited) !== 0) throw new Error(`docker compose ${args.join(' ')} failed`);
}

const anon = new Session('anon');
const searchFor = async (q: string) =>
  (await anon.call('GET', `/api/products?search=${encodeURIComponent(q)}&limit=50`)).json as unknown as {
    products: { id: string; name: string }[];
    total: number;
  };

// ── Platform ──────────────────────────────────────────────────────────────────
const health = await anon.call('GET', '/api/health');
check('gateway sees all services healthy', health.status === 200, health.json);

const spoofed = await anon.call('GET', '/api/admin/dashboard', undefined, {
  'x-user-id': '00000000-0000-4000-8000-000000000000',
  'x-session-id': 'spoofed',
  'x-active-role': 'admin',
});
check('client-supplied identity headers are ignored', spoofed.status === 401, spoofed.status);

// ── Seller: create a product and set its stock ────────────────────────────────
const seller = await new Session('seller').login('budi_santoso');
const marker = `smoke${Date.now().toString(36)}`;
const created = await seller.call('POST', '/api/seller/products', {
  name: `Kerupuk Udang ${marker}`,
  description: 'Produk uji smoke test',
  price: 25_000,
});
const productId = String(created.json.id ?? '');
check('seller creates a product in catalog', created.status === 200 && productId !== '', created.json);

const stocked = await seller.call('PUT', `/api/seller/inventory/${productId}`, { stock: 7 });
check('seller sets stock in commerce (read-through to catalog)', stocked.status === 200, stocked.json);

check(
  'new product becomes searchable (catalog outbox -> search)',
  await eventually(async () => (await searchFor(marker)).products.some((p) => p.id === productId)),
);
const stockOf = async () =>
  ((await anon.call('GET', `/api/products/${productId}`)).json as { stock?: number }).stock;
check('catalog shows the stock (commerce outbox -> catalog)', await eventually(async () => (await stockOf()) === 7));

// ── Buyer: cart and checkout ──────────────────────────────────────────────────
const buyer = await new Session('buyer').login('dewi_lestari');
await buyer.call('DELETE', '/api/buyers/cart');
const added = await buyer.call('POST', '/api/buyers/cart/items', { productId, quantity: 2 });
check('buyer adds the new product to the cart', added.status === 200, added.json);

const addresses = (await buyer.call('GET', '/api/buyers/addresses')).json as unknown as { id: string }[];
const order = await buyer.call('POST', '/api/orders', {
  deliveryMethod: 'instant',
  addressId: addresses[0]?.id,
});
const orderId = String(order.json.id ?? '');
check('checkout succeeds in one commerce transaction', order.status === 200 && orderId !== '', order.json);
check('stock drops in the catalog read model', await eventually(async () => (await stockOf()) === 5));

// ── Seller processes, driver delivers ─────────────────────────────────────────
const processed = await seller.call('POST', `/api/seller/orders/${orderId}/process`, {});
check('seller processes the order', processed.status === 200, processed.json);

const driver = await new Session('driver').login('joko_widodo');
const jobs = (await driver.call('GET', '/api/driver/jobs')).json as unknown as { id: string; orderId: string }[];
const job = Array.isArray(jobs) ? jobs.find((j) => j.orderId === orderId) : undefined;
check('driver sees the delivery job', Boolean(job), jobs);
const taken = await driver.call('POST', `/api/driver/jobs/${job?.id}/take`);
const completed = await driver.call('POST', `/api/driver/jobs/${job?.id}/complete`);
check('driver takes and completes the job', taken.status === 200 && completed.status === 200, completed.json);

const soldOf = async () =>
  ((await anon.call('GET', `/api/products/${productId}`)).json as { soldCount?: number }).soldCount;
check('sold count reaches catalog (commerce sales event)', await eventually(async () => (await soldOf()) === 2));

// ── Admin dashboard aggregates three services ─────────────────────────────────
const admin = await new Session('admin').login('admin');
const dashboard = await admin.call('GET', '/api/admin/dashboard');
const stats = dashboard.json as { users?: { total: number }; products?: { total: number } };
check(
  'admin dashboard combines identity, catalog and commerce',
  dashboard.status === 200 && (stats.users?.total ?? 0) > 0 && (stats.products?.total ?? 0) > 0,
  dashboard.json,
);

// ── Delete propagates to search and commerce ──────────────────────────────────
const deleted = await seller.call('DELETE', `/api/seller/products/${productId}`);
check('seller deletes the product', deleted.status === 200, deleted.json);
check(
  'deleted product leaves the search index',
  await eventually(async () => !(await searchFor(marker)).products.some((p) => p.id === productId)),
);
const readd = async () => (await buyer.call('POST', '/api/buyers/cart/items', { productId, quantity: 1 })).status;
check('commerce drops its replica (cart rejects the product)', await eventually(async () => (await readd()) === 404));

// ── Logout invalidates the session immediately ────────────────────────────────
const stale = buyer.cookie;
await buyer.call('POST', '/api/auth/logout');
const afterLogout = await anon.call('GET', '/api/auth/me', undefined, { cookie: stale });
check('a logged-out session is rejected', afterLogout.status === 401, afterLogout.status);

// ── Degraded modes ────────────────────────────────────────────────────────────
if (process.argv.includes('--resilience')) {
  await compose('stop', 'elasticsearch');
  const fallback = await searchFor('samsung');
  check('search still answers from the database when Elasticsearch is down', fallback.total > 0, fallback);
  await compose('start', 'elasticsearch');

  const buyer2 = await new Session('buyer2').login('sari_dewi');
  await compose('stop', 'catalog');
  const history = await buyer2.call('GET', '/api/orders');
  check('order history works while catalog is down', history.status === 200, history.status);
  await compose('start', 'catalog');
}

console.log(failures === 0 ? '\nAll smoke checks passed.' : `\n${failures} smoke check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
