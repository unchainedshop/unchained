// Access tokens: sha256 hash of the plain token
// Each user has a unique token for proper permission testing
export const ADMIN_TOKEN = 'Bearer admin-secret';
export const USER_TOKEN = 'Bearer user-secret';
export const GUEST_TOKEN = 'Bearer guest-secret';

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
      bcrypt: '$2b$10$UjNk75pHOmaIiUMtfmNxPeLrs56qSpA4nRFf7ub6MPI7HF07usCJ2',
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
      bcrypt: '$2b$10$UjNk75pHOmaIiUMtfmNxPeLrs56qSpA4nRFf7ub6MPI7HF07usCJ2',
    },
    token: {
      // sha256("user-secret")
      secret: 'fa32968772a8ee3fbd6f842644e210e8d27d27ac97742fe7f1910778fc3fa21d',
    },
  },
};

export const UnverifiedUser = {
  _id: 'user-unverified',
  username: 'user',
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
      bcrypt: '$2b$10$UjNk75pHOmaIiUMtfmNxPeLrs56qSpA4nRFf7ub6MPI7HF07usCJ2',
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

export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User);
  await Users.findOrInsertOne(Guest);
  await Users.findOrInsertOne(UnverifiedUser);
}
