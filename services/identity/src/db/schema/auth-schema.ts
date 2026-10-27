import {
  type AnyPgColumn,
  char,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  isOnboarded: boolean('is_onboarded').default(false).notNull(),
  avatarKey: varchar('avatar_key', { length: 512 }),
  // Bumped on every change that is published (`identity.user.*`), so consumers can order events.
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRole = pgTable('user_role', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'admin', 'seller', 'buyer', 'driver'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// One row per signed-in device. Revoking it ends that device's session only.
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activeRole: varchar('active_role', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

// Rotated on every use; a used token presented again means it leaked, so the session is revoked.
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    // The token this one was rotated into; the session is the token family.
    replacedBy: uuid('replaced_by').references((): AnyPgColumn => refreshTokens.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('refresh_tokens_session_id_idx').on(t.sessionId)],
);

// Client-credentials callers (catalog, search, seed). Synced from SERVICE_CLIENT_SECRETS at boot.
export const serviceClients = pgTable('service_clients', {
  clientId: varchar('client_id', { length: 64 }).primaryKey(),
  secretHash: char('secret_hash', { length: 64 }).notNull(), // sha256 hex
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
