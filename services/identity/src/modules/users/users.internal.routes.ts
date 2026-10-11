import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { UsersService } from './users.service';

/** Internal user lookups for other services. Never exposes credentials or emails. */
export const usersInternalRouter = factory.createApp();

usersInternalRouter.get(
  '/',
  describeRoute({ hide: true }),
  validator('query', z.object({ ids: z.string().transform((v) => v.split(',').filter(Boolean)) })),
  async (c) => {
    const { ids } = c.req.valid('query');
    const users = await UsersService.getDisplayNames(ids);
    return c.json({ users });
  },
);

usersInternalRouter.get('/stats', describeRoute({ hide: true }), async (c) => {
  return c.json(await UsersService.getStats());
});
