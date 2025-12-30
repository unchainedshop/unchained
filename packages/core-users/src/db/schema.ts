import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { Address, Contact } from '@unchainedshop/mongodb';

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
    meta: text('meta', { mode: 'json' }),
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
