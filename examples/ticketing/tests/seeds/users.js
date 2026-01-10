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
      secret: 'fa32968772a8ee3fbd6f842644e210e8d27d27ac97742fe7f1910778fc3fa21d',
    },
  },
};

export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User); 
}
