import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { Address, Contact } from '@unchainedshop/utils';

export interface UserProfile {
  displayName?: string;
  birthday?: Date;
  phoneMobile?: string;
  gender?: string;
  address?: Address;
}

export interface UserLastLogin {
  timestamp?: Date;
  locale?: string;
  countryCode?: string;
  remoteAddress?: string;
  remotePort?: number;
  userAgent?: string;
}

export interface PushSubscriptionObject {
  userAgent: string;
  endpoint: string;
  expirationTime: number;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface Email {
  address: string;
  verified: boolean;
}

// Services is a complex nested structure containing auth tokens, password hashes, etc.
// Kept as JSON to preserve the dynamic nature of auth services
export interface UserServices {
  password?: {
    pbkdf2?: string;
    reset?: {
      token: string;
      address: string;
      when: Date;
    }[];
  };
  email?: {
    verificationTokens?: {
      token: string;
      address: string;
      when: Date;
    }[];
  };
  token?: {
    secret: string;
  };
  web3?: {
    address: string;
    nonce?: string;
    verified?: boolean;
  }[];
  webAuthn?: {
    id: string;
    publicKey: string;
    algorithm?: string;
    aaguid?: string;
    counter?: number;
    created: Date;
  }[];
}

export const users = sqliteTable(
  'users',
  {
    _id: text('_id').primaryKey(),
    username: text('username'),
    guest: integer('guest', { mode: 'boolean' }).notNull().default(false),
    initialPassword: integer('initialPassword', { mode: 'boolean' }).notNull().default(false),
    avatarId: text('avatarId'),
    roles: text('roles', { mode: 'json' }).$type<string[]>().notNull().default([]),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    // Nested objects as JSON
    emails: text('emails', { mode: 'json' }).$type<Email[]>().notNull().default([]),
    services: text('services', { mode: 'json' }).$type<UserServices>(),
    profile: text('profile', { mode: 'json' }).$type<UserProfile>(),
    lastLogin: text('lastLogin', { mode: 'json' }).$type<UserLastLogin>(),
    lastBillingAddress: text('lastBillingAddress', { mode: 'json' }).$type<Address>(),
    lastContact: text('lastContact', { mode: 'json' }).$type<Contact>(),
    pushSubscriptions: text('pushSubscriptions', { mode: 'json' })
      .$type<PushSubscriptionObject[]>()
      .notNull()
      .default([]),
    // Token version for instant token revocation (increment to invalidate all tokens)
    tokenVersion: integer('tokenVersion').notNull().default(1),
    // OIDC logout timestamp (tokens issued before this are invalid)
    oidcLogoutAt: integer('oidcLogoutAt', { mode: 'timestamp_ms' }),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('idx_users_username').on(table.username),
    index('idx_users_guest').on(table.guest),
    index('idx_users_created').on(table.created),
    index('idx_users_deleted').on(table.deleted),
  ],
);

export const webauthnCredentialsRequests = sqliteTable(
  'webauthn_credentials_requests',
  {
    _id: text('_id').primaryKey(),
    challenge: text('challenge').notNull(),
    username: text('username'),
    origin: text('origin'),
    factor: text('factor'), // 'first' | 'second' | 'either'
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_webauthn_username').on(table.username)],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type WebAuthnRequestRow = typeof webauthnCredentialsRequests.$inferSelect;
export type NewWebAuthnRequestRow = typeof webauthnCredentialsRequests.$inferInsert;

// Domain interface - uses undefined instead of null for optional fields
export interface User {
  _id: string;
  deleted?: Date;
  avatarId?: string;
  emails: Email[];
  guest: boolean;
  initialPassword: boolean;
  lastBillingAddress?: Address;
  lastContact?: Contact;
  lastLogin?: UserLastLogin;
  profile?: UserProfile;
  roles: string[];
  services: any; // Keep as `any` for backward compatibility with API resolvers
  tags?: string[];
  pushSubscriptions: PushSubscriptionObject[];
  username?: string;
  meta?: any;
  // Token version for instant revocation - increment to invalidate all tokens
  tokenVersion: number;
  // OIDC logout timestamp - tokens issued before this are invalid
  oidcLogoutAt?: Date;
  created: Date;
  updated?: Date;
}

// Transform database row to domain object
export const rowToUser = (row: UserRow): User => ({
  _id: row._id,
  username: row.username ?? undefined,
  guest: row.guest,
  initialPassword: row.initialPassword,
  avatarId: row.avatarId ?? undefined,
  roles: row.roles,
  tags: row.tags ?? undefined,
  meta: row.meta ?? undefined,
  emails: row.emails,
  services: row.services ?? undefined,
  profile: row.profile ?? undefined,
  lastLogin: row.lastLogin ?? undefined,
  lastBillingAddress: row.lastBillingAddress ?? undefined,
  lastContact: row.lastContact ?? undefined,
  pushSubscriptions: row.pushSubscriptions,
  tokenVersion: row.tokenVersion,
  oidcLogoutAt: row.oidcLogoutAt ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? undefined,
});
