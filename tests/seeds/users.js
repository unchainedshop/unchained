export const ADMIN_TOKEN = 'Bearer JOytDLyIQL3lOY1K1EfKx_S_nh13kOIe9h_J8E3mDWO';
export const USER_TOKEN = 'Bearer U8CGfEBGEFM9s97hFamxruxV9VlvfRw5CbQ27Ci0WWz';

export const Admin = {
  _id: 'admin',
  username: 'admin',
  emails: [
    {
      address: 'admin@localhost',
      verified: true
    }
  ],
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: ['admin'],
  services: {
    password: {
      bcrypt: '$2b$10$UjNk75pHOmaIiUMtfmNxPeLrs56qSpA4nRFf7ub6MPI7HF07usCJ2'
    },
    resume: {
      loginTokens: [
        {
          when: new Date(new Date().getTime() + 1000000),
          hashedToken: 'XX1ivUOcPmJ/tzP0TRwoVuBLuRZod2t2QtZu+kHTThg='
        }
      ]
    }
  }
};

export const User = {
  _id: 'user',
  username: 'user',
  emails: [
    {
      address: 'user@localhost',
      verified: true
    }
  ],
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: [],
  services: {
    password: {
      bcrypt: '$2b$10$UjNk75pHOmaIiUMtfmNxPeLrs56qSpA4nRFf7ub6MPI7HF07usCJ2'
    },
    resume: {
      loginTokens: [
        {
          when: new Date(new Date().getTime() + 1000000),
          hashedToken: 'WeMY99U5lhhJJTpC7bw6voIN6Q2ETWEyEhkXpn9G9ls'
        }
      ]
    }
  }
};
