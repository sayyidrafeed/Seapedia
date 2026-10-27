// Least-privilege broker users: each service may only publish its own `<service>.*` routing keys.
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
for (const svc of services) {
  const password = process.env[`RABBITMQ_${svc.toUpperCase()}_PASSWORD`];
  if (!password) throw new Error(`RABBITMQ_${svc.toUpperCase()}_PASSWORD is required`);
  const own = `^(seapedia\\..*|${svc}(\\..*)?|amq\\.gen.*|amq\\.default)$`;
  await call('PUT', `users/${svc}`, { password, tags: '' });
  await call('PUT', `permissions/${vhost}/${svc}`, { configure: own, write: own, read: own });
  await call('PUT', `topic-permissions/${vhost}/${svc}`, {
    exchange: 'seapedia.events',
    write: `^${svc}\\.`,
    read: '.*',
  });
  console.log(`rabbitmq user ${svc} ready`);
}
