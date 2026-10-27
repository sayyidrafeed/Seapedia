import { AsyncLocalStorage } from 'node:async_hooks';
import { factory } from './factory';

const store = new AsyncLocalStorage<{ requestId: string }>();

// Makes the current request id available to outgoing internal calls. Run after `requestId()`.
export const requestContext = factory.createMiddleware((c, next) =>
  store.run({ requestId: c.get('requestId') }, next),
);

export function currentRequestId(): string | undefined {
  return store.getStore()?.requestId;
}
