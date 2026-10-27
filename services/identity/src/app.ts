import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { authRouter } from '@/modules/auth/auth.index';
import { jwksRouter, oauthRouter } from '@/modules/oauth/oauth.index';
import { privateRouter } from '@/modules/private/private.index';
import { usersRouter } from '@/modules/users/users.index';
import { runtime } from '@/runtime';

export const app = createServiceApp({
  name: 'identity',
  verifier: runtime.verifier,
  denylist: runtime.denylist,
});

// Public API (reached through Kong)
app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/private', privateRouter);
app.route('/.well-known', jwksRouter);

// Service-to-service (client credentials); never routed by Kong
app.route('/oauth', oauthRouter);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Identity')()));
