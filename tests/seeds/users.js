export const ADMIN_TOKEN = 'Bearer JOytDLyIQL3lOY1K1EfKx_S_nh13kOIe9h_J8E3mDWO';
export const USER_TOKEN = 'Bearer nYhR7GjP4Ur4-oMw1Ns7Ti61_0jB3YM5d0XrnXKc2qQ';

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
    resume: {
      loginTokens: [
        {
          when: new Date(new Date().getTime() + 1000000),
          hashedToken: 'XX1ivUOcPmJ/tzP0TRwoVuBLuRZod2t2QtZu+kHTThg=',
        },
      ],
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
    resume: {
      loginTokens: [
        {
          when: new Date(new Date().getTime() + 1000000),
          hashedToken: '5VVf9TC/VQVcA271Muuhc4Y2QEtye79UnBR8Ib8oIi8=',
        },
      ],
    },
  },
  language: {
    isoCode: 'de',
  },
  country: {
    isoCode: 'CH',
  },
};

export default async function seedUsers(db) {
  const Users = db.collection('users');
  await Users.findOrInsertOne(Admin);
  await Users.findOrInsertOne(User);
}
