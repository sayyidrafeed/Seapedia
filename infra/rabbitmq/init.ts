// Owns the broker topology and least-privilege users. A service publishes only its own
// `<service>.*` events, parks only into its own queue, and touches no other service's queues.
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

for (const svc of services) {
  const password = process.env[`RABBITMQ_${svc.toUpperCase()}_PASSWORD`];
  if (!password) throw new Error(`RABBITMQ_${svc.toUpperCase()}_PASSWORD is required`);
  // Own durable queues plus server-named exclusive ones (session denylist).
  const queues = `${svc}|${svc}\\.retry|${svc}\\.parked|amq\\.gen-.*`;
  await call('PUT', `users/${svc}`, { password, tags: '' });
  await call('PUT', `permissions/${vhost}/${svc}`, {
    configure: `^(${queues})$`,
    // Write on a queue is what binding it needs; the retry exchanges are written by the broker.
    write: `^(seapedia\\.events|seapedia\\.parking|${queues})$`,
    read: `^(seapedia\\.events|seapedia\\.retry|seapedia\\.redeliver|seapedia\\.parking|${queues})$`,
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
