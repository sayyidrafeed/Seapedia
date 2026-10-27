import { inboxTable, outboxTable } from '@seapedia/platform/events/postgres';

export const outbox = outboxTable();
export const inbox = inboxTable();
