import { createFactory } from 'hono/factory';

/** Context variables shared by every service. Identity fields are set by `requireSession`. */
export type ServiceEnv = {
  Variables: {
    userId?: string;
    sessionId?: string;
    activeRole?: string;
    requestId: string;
  };
};

/** Context after `requireSession` has run. */
export type AuthEnv = {
  Variables: {
    userId: string;
    sessionId: string;
    activeRole: string;
    requestId: string;
  };
};

export const factory = createFactory<ServiceEnv>();
