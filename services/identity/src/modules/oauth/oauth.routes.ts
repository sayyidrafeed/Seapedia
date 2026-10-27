import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { jwks, signServiceToken } from '@/lib/tokens';
import { SERVICE_POLICY } from './oauth.policy';
import { OAuthService } from './oauth.service';

// OAuth2 client-credentials for service-to-service calls. Not routed by the gateway.
export const oauthRouter = factory.createApp();

oauthRouter.post(
  '/token',
  describeRoute({ hide: true }),
  validator(
    'json',
    z.object({
      grant_type: z.literal('client_credentials'),
      client_id: z.string(),
      client_secret: z.string(),
      audience: z.string(),
      scope: z.string().default(''),
    }),
  ),
  async (c) => {
    const req = c.req.valid('json');
    if (!(await OAuthService.authenticate(req.client_id, req.client_secret))) {
      return c.json({ error: 'invalid_client' }, 401);
    }

    const allowed = SERVICE_POLICY[req.client_id]?.[req.audience] ?? [];
    const requested = req.scope.split(' ').filter(Boolean);
    const granted = requested.length > 0 ? requested.filter((s) => allowed.includes(s)) : allowed;
    if (granted.length === 0 || granted.length !== (requested.length || granted.length)) {
      return c.json({ error: 'invalid_scope' }, 403);
    }

    const { token, ttl } = await signServiceToken(req.client_id, req.audience, granted);
    return c.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: ttl,
      scope: granted.join(' '),
    });
  },
);

// Public: Kong and services can fetch the key that verifies identity's tokens.
export const jwksRouter = factory.createApp();

jwksRouter.get('/jwks.json', describeRoute({ hide: true }), async (c) => c.json(await jwks()));
