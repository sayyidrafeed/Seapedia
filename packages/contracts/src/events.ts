import { createEvent, type EventEnvelope } from '@seapedia/platform/events';
import { z } from 'zod';

// Published language: each event's payload, owned by its producer, shared so producer and consumers cannot drift.
const identityUser = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  roles: z.array(z.string()),
});

const catalogStore = z.object({
  id: z.string(),
  sellerId: z.string(),
  name: z.string(),
  slug: z.string(),
  logoKey: z.string().nullable(),
  rating: z.number(),
  reviewCount: z.number().int(),
  totalProducts: z.number().int(),
});

const catalogProduct = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number().int(),
  imageKey: z.string().nullable(),
  rating: z.number(),
  reviewCount: z.number().int(),
  soldCount: z.number().int(),
  createdAt: z.string(),
});

export const eventSchemas = {
  'identity.user.registered': identityUser,
  'identity.user.updated': identityUser,
  'identity.session.revoked': z.object({ sessionId: z.string(), expiresAt: z.number().int() }),
  'catalog.store.upserted': catalogStore,
  'catalog.product.upserted': catalogProduct,
  'catalog.product.deleted': z.object({ id: z.string() }),
  'commerce.inventory.changed': z.object({ productId: z.string(), stock: z.number().int() }),
  'commerce.order.completed': z.object({
    orderId: z.string(),
    buyerId: z.string(),
    items: z.array(z.object({ productId: z.string().nullable(), quantity: z.number().int() })),
  }),
} as const;

export type EventType = keyof typeof eventSchemas;
export type EventData<T extends EventType> = z.infer<(typeof eventSchemas)[T]>;

export function event<T extends EventType>(
  type: T,
  data: EventData<T>,
  version: number,
): EventEnvelope<EventData<T>> {
  return createEvent(
    type.split('.')[0],
    type,
    eventSchemas[type].parse(data) as EventData<T>,
    version,
  );
}

export function dataOf<T extends EventType>(type: T, envelope: EventEnvelope): EventData<T> {
  return eventSchemas[type].parse(envelope.data) as EventData<T>;
}
