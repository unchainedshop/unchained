export default {
  _id: 'PKve0k9fLCUzn2EUi',
  guest: false,
  initialPassword: false,
  lastBillingAddress: null,
  profile: {
    address: {
      firstName: null,
      lastName: null,
      company: null,
      addressLine: null,
      addressLine2: null,
      postalCode: null,
      regionCode: null,
      city: null,
      countryCode: null,
    },
    birthday: new Date('2022-11-21T21:00:00.000Z'),
    displayName: null,
    gender: null,
    phoneMobile: null,
  },
  roles: ['admin'],
  services: {
    password: {
      bcrypt: '$2a$10$EM5ILD3UtmiP/JJzDvhL3ennDpMEYXfFCCPZ6AiSk3ZM1aPUSjoI2',
      reset: [
        {
          token:
            '637dfa08a1a48aba26437de983a6cef32fef369252c97791b81712b2283a1173308efade2666d24dab6aa4',
          address: 'admin@unchained.local',
          when: new Date('2022-11-26T19:37:30.170Z'),
          reason: 'reset',
        },
      ],
    },
    token: {
      secret: 'secret',
    },
    webAuthn: [],
    web3: [
      {
        address: '0xF5F72AE7fa1fa990ebaF163208Ed7aD6a3f42DEA',
        nonce: '463693',
      },
    ],
    'two-factor': {
      secret: {
        base32: 'JF2HO5SAN4YFE7LLKR4FMRSXN47ESVCE',
      },
    },
  },
  createdAt: new Date('2022-10-20T17:14:48.834Z'),
  updatedAt: new Date('2022-11-26T19:17:57.131Z'),
  username: 'admin',
  emails: [
    {
      address: 'admin@unchained.local',
      verified: false,
    },
  ],
  lastLogin: {
    timestamp: new Date('2022-11-28T16:28:53.202Z'),
    remoteAddress: '::ffff:127.0.0.1',
    remotePort: '42978',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    locale: 'de-CH',
    countryCode: 'CH',
  },
  updated: new Date('2022-11-30T11:02:19.624Z'),
};
