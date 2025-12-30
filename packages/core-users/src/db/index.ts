import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupUsersFTS } from './fts.ts';

export {
  users,
  webauthnCredentialsRequests,
  rowToUser,
  type User,
  type UserRow,
  type NewUserRow,
  type WebAuthnRequestRow,
  type NewWebAuthnRequestRow,
  type UserProfile,
  type UserLastLogin,
  type PushSubscriptionObject,
  type Email,
  type UserServices,
} from './schema.ts';

export { searchUsersFTS } from './fts.ts';

export async function initializeUsersSchema(db: DrizzleDb): Promise<void> {
  // Create users table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      _id TEXT PRIMARY KEY,
      username TEXT,
      guest INTEGER NOT NULL DEFAULT 0,
      initialPassword INTEGER NOT NULL DEFAULT 0,
      avatarId TEXT,
      roles TEXT NOT NULL DEFAULT '[]',
      tags TEXT,
      meta TEXT,
      emails TEXT NOT NULL DEFAULT '[]',
      services TEXT,
      profile TEXT,
      lastLogin TEXT,
      lastBillingAddress TEXT,
      lastContact TEXT,
      pushSubscriptions TEXT NOT NULL DEFAULT '[]',
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_guest ON users(guest)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_created ON users(created)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted)`);

  // Create webauthn requests table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS webauthn_credentials_requests (
      _id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      username TEXT,
      origin TEXT,
      factor TEXT,
      created INTEGER NOT NULL
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_webauthn_username ON webauthn_credentials_requests(username)`,
  );

  // Setup FTS
  await setupUsersFTS(db);
}
