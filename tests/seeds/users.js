export const ADMIN_TOKEN = 'Bearer admin:secret';
export const USER_TOKEN = 'Bearer user:secret';

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
      secret: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
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
      secret: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
    },
  },
};

export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User);
}
