import { users } from '@unchainedshop/core-users';
import { sql } from 'drizzle-orm';
import { signAccessToken } from '@unchainedshop/api/lib/auth.js';

// Generate JWT tokens for test users (version 1 matches default tokenVersion)
const { token: adminToken } = signAccessToken('admin', 1);
const { token: userToken } = signAccessToken('user', 1);
const { token: guestToken } = signAccessToken('guest', 1);

export const ADMIN_TOKEN = `Bearer ${adminToken}`;
export const USER_TOKEN = `Bearer ${userToken}`;
export const GUEST_TOKEN = `Bearer ${guestToken}`;

// PBKDF2 hash for password "password"
const PBKDF2_PASSWORD_HASH =
  '90f42a4f7f9a1860a13e95354a4775e9:e278bd10aeb452f52f70c338fd6a51325b79398fba15d4a9a4562199a5934592';

export const Admin = {
  _id: 'admin',
  username: 'admin',
  emails: [{ address: 'admin@unchained.local', verified: true }],
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: ['admin'],
  services: {
    password: { pbkdf2: PBKDF2_PASSWORD_HASH },
    token: { secret: '901b281c4e0c4007e8526ef27153b79330811e733976d5e65c8343a39e54ec81' },
  },
};

export const User = {
  _id: 'user',
  username: 'user',
  emails: [{ address: 'user@unchained.local', verified: true }],
  profile: { gender: 'm' },
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    password: { pbkdf2: PBKDF2_PASSWORD_HASH },
    token: { secret: '92592125f3859823818804f00932aca5b658d7a334a5feaa8ab7fa321702e913' },
  },
};

export const UnverifiedUser = {
  _id: 'user-unverified',
  username: 'user-unverified',
  emails: [{ address: 'user-unverfied@unchained.local', verified: false }],
  profile: { gender: 'm' },
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    password: { pbkdf2: PBKDF2_PASSWORD_HASH },
    token: { secret: '92592125f3859823818804f00932aca5b658d7a334a5feaa8ab7fa321702e913' },
  },
};

export const Guest = {
  _id: 'guest',
  username: 'guest',
  emails: [{ address: 'guest@unchained.local', verified: false }],
  profile: { gender: 'm' },
  guest: true,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    token: { secret: 'fd3d2dcf2d30d944076c0c26d195c0919e98cdb9aa08aa539a930f27743a8d9c' },
  },
};

export async function seedUsersToDrizzle(db) {
  await db.delete(users);
  await db.run(sql`DELETE FROM users_fts`);

  for (const userData of [Admin, User, Guest, UnverifiedUser]) {
    await db.insert(users).values({
      _id: userData._id,
      username: userData.username,
      emails: userData.emails,
      guest: userData.guest,
      roles: userData.roles,
      services: userData.services,
      profile: userData.profile,
      pushSubscriptions: [],
      tokenVersion: 1,
      created: userData.created,
      updated: userData.updated,
    });
    await db.run(
      sql`INSERT INTO users_fts(_id, username) VALUES (${userData._id}, ${userData.username})`,
    );
  }
}

export async function findOrInsertUserToDrizzle(db, userData) {
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`${users._id} = ${userData._id}`)
    .limit(1);
  if (existing) return existing;

  await db.insert(users).values({
    _id: userData._id,
    username: userData.username,
    emails: userData.emails || [],
    guest: userData.guest || false,
    roles: userData.roles || [],
    services: userData.services,
    profile: userData.profile,
    pushSubscriptions: userData.pushSubscriptions || [],
    created: userData.created || new Date(),
    updated: userData.updated,
  });

  if (userData.username) {
    await db.run(
      sql`INSERT OR IGNORE INTO users_fts(_id, username) VALUES (${userData._id}, ${userData.username})`,
    );
  }

  const [newUser] = await db
    .select()
    .from(users)
    .where(sql`${users._id} = ${userData._id}`)
    .limit(1);
  return newUser;
}

export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User);
  await Users.findOrInsertOne(Guest);
  await Users.findOrInsertOne(UnverifiedUser);
}
