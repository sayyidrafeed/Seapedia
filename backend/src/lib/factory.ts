import { createFactory } from 'hono/factory';

type Env = {
  Variables: {
    userId?: string;
    sessionId?: string;
    activeRole?: string;
  };
};

export const factory = createFactory<Env>();
