import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { AuthService } from './auth.service';

/** Internal: used by the gateway to resolve the `__session` cookie on every request. */
export const authInternalRouter = factory.createApp();

authInternalRouter.post(
  '/introspect',
  describeRoute({ hide: true }),
  validator('json', z.object({ token: z.string().min(1) })),
  async (c) => {
    const { token } = c.req.valid('json');
    const session = await AuthService.introspect(token);
    if (!session) return c.json({ active: false as const }, 200);
    return c.json({ active: true as const, ...session });
  },
);
