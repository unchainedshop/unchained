export const ADMIN_TOKEN = 'Bearer admin:secret';
export const USER_TOKEN = 'Bearer user:secret';
export const GUEST_TOKEN = 'Bearer guest:secret';

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
      secret: '901b281c4e0c4007e8526ef27153b79330811e733976d5e65c8343a39e54ec81',
    },
  },
};

export const User = {
  _id: 'user',
  username: 'user',
  emails: [
    {
      address: 'user@unchained.local',
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
      secret: '92592125f3859823818804f00932aca5b658d7a334a5feaa8ab7fa321702e913',
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
      secret: '92592125f3859823818804f00932aca5b658d7a334a5feaa8ab7fa321702e913',
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
      secret: 'fd3d2dcf2d30d944076c0c26d195c0919e98cdb9aa08aa539a930f27743a8d9c',
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
