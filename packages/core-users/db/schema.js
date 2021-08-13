import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Users } from './collections';
import * as Collections from './collections';

const { Address, timestampFields } = Schemas;

export const ProfileSchema = new SimpleSchema(
  {
    displayName: String,
    birthday: Date,
    phoneMobile: String,
    gender: String,
    address: Address,
    customFields: {
      type: Object,
      optional: true,
      blackbox: true,
    },
  },
  { requiredByDefault: false }
);

export const LastLoginSchema = new SimpleSchema(
  {
    timestamp: Date,
    locale: String,
    countryContext: String,
    remoteAddress: String,
    remotePort: String,
    userAgent: String,
  },
  { requiredByDefault: false }
);

export const LastContactSchema = new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String,
  },
  { requiredByDefault: false }
);

export const UserSchema = new SimpleSchema(
  {
    emails: Array,
    'emails.$': Object,
    'emails.$.address': String,
    'emails.$.verified': Boolean,
    username: String,
    lastLogin: LastLoginSchema,
    profile: ProfileSchema,
    lastBillingAddress: Address,
    lastContact: LastContactSchema,
    guest: Boolean,
    initialPassword: Boolean,
    tags: Array,
    'tags.$': String,
    avatarId: String,
    services: {
      type: Object,
      optional: true,
      blackbox: true,
    },
    roles: Array,
    'roles.$': String,
    ...timestampFields,
  },
  { requiredByDefault: false }
);

Users.attachSchema(UserSchema);

const buildIndexes = async () => {
  await Collections.Users.rawCollection().createIndex(
    {
      username: 1,
    },
    {
      unique: true,
      sparse: true,
    }
  );
  await Collections.Users.rawCollection().createIndex(
    {
      'emails.address': 1,
    },
    {
      unique: true,
      sparse: true,
    }
  );

  await Collections.Users.rawCollection().createIndex(
    {
      'services.email.verificationTokens.token': 1,
    },
    {
      sparse: true,
    }
  );

  await Collections.Users.rawCollection().createIndex(
    {
      'services.password.reset.token': 1,
    },
    {
      sparse: true,
    }
  );

  await Collections.Users.rawCollection().createIndex(
    {
      'services.resume.loginTokens.hashedToken': 1,
    },
    {
      sparse: true,
    }
  );

  await Collections.Users.rawCollection().createIndex(
    {
      _id: 'text',
      username: 'text',
      'emails.address': 'text',
      'profile.displayName': 'text',
      'lastBillingAddress.firstName': 'text',
      'lastBillingAddress.lastName': 'text',
      'lastBillingAddress.company': 'text',
      'lastBillingAddress.addressLine': 'text',
      'lastBillingAddress.addressLine2': 'text',
    },
    {
      weights: {
        _id: 9,
        'emails.address': 7,
        'profile.displayName': 5,
        'lastBillingAddress.firstName': 3,
        'lastBillingAddress.lastName': 3,
        'lastBillingAddress.company': 1,
        'lastBillingAddress.addressLine': 1,
        'lastBillingAddress.addressLine2': 1,
      },
      name: 'user_fulltext_search',
    }
  );
};

export default async () => {
  try {
    await buildIndexes();
  } catch (e) {
    await Collections.Users.rawCollection().dropIndexes();
    try {
      await buildIndexes();
    } catch (e) {} // eslint-disable-line
  }
};
