import { users } from '@unchainedshop/core-users';
import { sql } from 'drizzle-orm';

// Access tokens: sha256 hash of the plain token
// Each user has a unique token for proper permission testing
export const ADMIN_TOKEN = 'Bearer admin-secret';
export const USER_TOKEN = 'Bearer user-secret';
export const GUEST_TOKEN = 'Bearer guest-secret';

// PBKDF2 hash for password "password"
const PBKDF2_PASSWORD_HASH =
  '90f42a4f7f9a1860a13e95354a4775e9:e278bd10aeb452f52f70c338fd6a51325b79398fba15d4a9a4562199a5934592';

export const Admin = {
  _id: 'admin',
  username: 'admin',
  emails: [
    {
      address: 'admin@unchained.local',
      verified: true,
    },
  ],
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: ['admin'],
  services: {
    password: {
      pbkdf2: PBKDF2_PASSWORD_HASH,
    },
    token: {
      // sha256("admin-secret")
      secret: '16175223c8ddce5ace0493c948569c211b03c4c6bb3d3e484434999448cffe01',
    },
  },
};

export const User = {
  _id: 'user',
  username: 'user',
  emails: [
    {
      address: 'user@unchained.local',
      verified: true,
    },
  ],
  profile: {
    gender: 'm',
  },
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    password: {
      pbkdf2: PBKDF2_PASSWORD_HASH,
    },
    token: {
      // sha256("user-secret")
      secret: 'fa32968772a8ee3fbd6f842644e210e8d27d27ac97742fe7f1910778fc3fa21d',
    },
  },
};

export const UnverifiedUser = {
  _id: 'user-unverified',
  username: 'user-unverified',
  emails: [
    {
      address: 'user-unverfied@unchained.local',
      verified: false,
    },
  ],
  profile: {
    gender: 'm',
  },
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    password: {
      pbkdf2: PBKDF2_PASSWORD_HASH,
    },
    token: {
      // sha256("user-secret") - same as User
      secret: 'fa32968772a8ee3fbd6f842644e210e8d27d27ac97742fe7f1910778fc3fa21d',
    },
  },
};

export const Guest = {
  _id: 'guest',
  username: 'guest',
  emails: [
    {
      address: 'guest@unchained.local',
      verified: false,
    },
  ],
  profile: {
    gender: 'm',
  },
  guest: true,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    token: {
      // sha256("guest-secret")
      secret: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
    },
  },
};

export async function seedUsersToDrizzle(db) {
  // Clear existing users and FTS
  await db.delete(users);
  await db.run(sql`DELETE FROM users_fts`);

  const allUsers = [Admin, User, Guest, UnverifiedUser];

  for (const userData of allUsers) {
    await db.insert(users).values({
      _id: userData._id,
      username: userData.username,
      emails: userData.emails,
      guest: userData.guest,
      roles: userData.roles,
      services: userData.services,
      profile: userData.profile,
      pushSubscriptions: [],
      created: userData.created,
      updated: userData.updated,
    });

    // Seed FTS
    await db.run(
      sql`INSERT INTO users_fts(_id, username) VALUES (${userData._id}, ${userData.username})`,
    );
  }
}

// Helper function to insert or find a user
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

  // Insert into FTS
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

// Legacy function for backward compatibility during migration
export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User);
  await Users.findOrInsertOne(Guest);
  await Users.findOrInsertOne(UnverifiedUser);
}
