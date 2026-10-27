// Owns the broker topology (exchanges, queues, bindings) and least-privilege users. A service
// publishes only its own `<service>.*` events, parks only into its own queue, and reads only its
// own queue and the session-revocation stream.
const api = process.env.RABBITMQ_API ?? 'http://rabbitmq:15672';
const admin = `Basic ${btoa(`${process.env.RABBITMQ_ADMIN_USER}:${process.env.RABBITMQ_ADMIN_PASSWORD}`)}`;
const vhost = 'seapedia';
const services = ['identity', 'catalog', 'commerce', 'search'] as const;

async function call(method: string, path: string, body?: unknown) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${api}/api/${path}`, {
        method,
        headers: { authorization: admin, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
      return;
    } catch (error) {
      if (attempt >= 30) throw error;
      await Bun.sleep(2000);
    }
  }
}

await call('PUT', `vhosts/${vhost}`, {});
const exchanges = {
  'seapedia.events': 'topic',
  'seapedia.retry': 'direct',
  'seapedia.redeliver': 'direct',
  // Topic, so topic permissions can pin each service to its own routing key.
  'seapedia.parking': 'topic',
};
for (const [name, type] of Object.entries(exchanges)) {
  await call('PUT', `exchanges/${vhost}/${name}`, { type, durable: true });
}

const bind = (exchange: string, queue: string, routingKey: string) =>
  call('POST', `bindings/${vhost}/e/${exchange}/q/${encodeURIComponent(queue)}`, {
    routing_key: routingKey,
  });

// Who listens to what. Declared here, before any service runs, so an event published before its
// consumers first start still reaches them. A new subscription is added here, not in the service.
const subscriptions = {
  catalog: [
    'identity.user.registered',
    'identity.user.updated',
    'commerce.inventory.changed',
    'commerce.order.completed',
  ],
  commerce: [
    'catalog.product.upserted',
    'catalog.product.deleted',
    'catalog.store.upserted',
    'identity.user.registered',
    'identity.user.updated',
  ],
  search: ['catalog.product.upserted', 'catalog.product.deleted', 'catalog.store.upserted'],
};
const RETRY_DELAY_MS = 5000;
for (const [queue, routingKeys] of Object.entries(subscriptions)) {
  await call('PUT', `queues/${vhost}/${queue}`, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': 'seapedia.retry', 'x-dead-letter-routing-key': queue },
  });
  await call('PUT', `queues/${vhost}/${queue}.retry`, {
    durable: true,
    arguments: {
      'x-message-ttl': RETRY_DELAY_MS,
      'x-dead-letter-exchange': 'seapedia.redeliver',
      'x-dead-letter-routing-key': queue,
    },
  });
  await call('PUT', `queues/${vhost}/${queue}.parked`, { durable: true });
  await bind('seapedia.retry', `${queue}.retry`, queue);
  await bind('seapedia.redeliver', queue, queue);
  await bind('seapedia.parking', `${queue}.parked`, queue);
  for (const key of routingKeys) await bind('seapedia.events', queue, key);
}

// Kept for the longest access-token lifetime (identity caps it at 1 hour); small segments so old
// entries are actually dropped.
await call('PUT', `queues/${vhost}/session-revocations`, {
  durable: true,
  arguments: {
    'x-queue-type': 'stream',
    'x-max-age': '1h',
    'x-stream-max-segment-size-bytes': 1_000_000,
  },
});
await bind('seapedia.events', 'session-revocations', 'identity.session.revoked');

for (const svc of services) {
  const password = process.env[`RABBITMQ_${svc.toUpperCase()}_PASSWORD`];
  if (!password) throw new Error(`RABBITMQ_${svc.toUpperCase()}_PASSWORD is required`);
  await call('PUT', `users/${svc}`, { password, tags: '' });
  // Services declare nothing; they publish events, park their own failures, and read their own
  // queue plus the revocation stream. The broker itself dead-letters into the retry exchanges.
  await call('PUT', `permissions/${vhost}/${svc}`, {
    configure: '^$',
    write: '^(seapedia\\.events|seapedia\\.parking)$',
    read: `^(${svc}|session-revocations)$`,
  });
  await call('PUT', `topic-permissions/${vhost}/${svc}`, {
    exchange: 'seapedia.events',
    write: `^${svc}\\.`,
    read: '.*',
  });
  await call('PUT', `topic-permissions/${vhost}/${svc}`, {
    exchange: 'seapedia.parking',
    write: `^${svc}$`,
    read: '.*',
  });
  console.log(`rabbitmq user ${svc} ready`);
}
