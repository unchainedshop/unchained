import { Migrations } from 'meteor/percolate:migrations';
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

Migrations.add({
  version: 20180529,
  name: 'Move tags and guest from user.profile to user level',
  up() {
    Users.find()
      .fetch()
      .forEach((user) => {
        const { profile = {} } = user;
        const displayName =
          profile.displayName ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        Users.update(
          { _id: user._id },
          {
            $set: {
              tags: user.tags || null,
              guest: !!profile.guest,
              'profile.displayName': displayName,
            },
            $unset: {
              'profile.tags': 1,
              'profile.guest': 1,
              'profile.firstName': 1,
              'profile.lastName': 1,
            },
          }
        );
      });
  },
  down() {
    Users.find()
      .fetch()
      .forEach((user) => {
        const { profile = {} } = user;
        const displayName = profile.displayName || '';
        Users.update(
          { _id: user._id },
          {
            $set: {
              'profile.tags': user.tags || null,
              'profile.guest': user.guest || false,
              'profile.firstName': displayName.split(' ')[0],
              'profile.lastName': displayName.split(' ').splice(-1).join(' '),
            },
            $unset: {
              tags: 1,
              guest: 1,
              'profile.displayName': 1,
            },
          }
        );
      });
  },
});

Migrations.add({
  version: 20200103,
  name: 'lastLogin.country to lastLogin.countryContext',
  up() {
    Users.find()
      .fetch()
      .forEach((user) => {
        const { lastLogin } = user;
        if (lastLogin) {
          const { country } = lastLogin;
          Users.update(
            { _id: user._id },
            {
              $set: {
                'lastLogin.countryContext': country,
              },
              $unset: {
                'lastLogin.country': 1,
              },
            }
          );
        }
      });
  },
  down() {
    Users.find()
      .fetch()
      .forEach((user) => {
        const { lastLogin } = user;
        if (lastLogin) {
          const { countryContext } = lastLogin;
          Users.update(
            { _id: user._id },
            {
              $set: {
                'lastLogin.country': countryContext,
              },
              $unset: {
                'lastLogin.countryContext': 1,
              },
            }
          );
        }
      });
  },
});

Migrations.add({
  version: 20201207,
  name: 'Drop old user user index',
  up() {
    Collections.Users.rawCollection().dropIndex(
      'username_text_emails.address_text_profile.displayName_text_lastBillingAddress.firstName_text_lastBillingAddress.lastName_text_lastBillingAddress.company_text_lastBillingAddress.addressLine_text_lastBillingAddress.addressLine2_text'
    );
  },
  down() {},
});

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
