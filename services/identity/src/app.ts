import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { env } from '@/env';
import { authInternalRouter, authRouter } from '@/modules/auth/auth.index';
import { privateRouter } from '@/modules/private/private.index';
import { usersInternalRouter, usersRouter } from '@/modules/users/users.index';

export const app = createServiceApp({ name: 'identity', internalToken: env.INTERNAL_API_TOKEN });

// Public API (reached through the gateway)
app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/private', privateRouter);

// Internal API (service-to-service)
app.route('/internal/sessions', authInternalRouter);
app.route('/internal/users', usersInternalRouter);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Identity')()));
