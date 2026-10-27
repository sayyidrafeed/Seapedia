import { createFactory } from 'hono/factory';

// Context variables shared by every service. Identity fields are set by `authenticate`.
export type ServiceEnv = {
  Variables: {
    userId?: string;
    sessionId?: string;
    roles?: string[];
    activeRole?: string;
    // Calling service, set by `requireServiceScope`.
    serviceClient?: string;
    requestId: string;
  };
};

// Context after `requireSession` has run.
export type AuthEnv = {
  Variables: {
    userId: string;
    sessionId: string;
    roles: string[];
    activeRole: string;
    requestId: string;
  };
};

export const factory = createFactory<ServiceEnv>();
