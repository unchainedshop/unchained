import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

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
      blackbox: true
    }
  },
  { requiredByDefault: false }
);

export const LastLoginSchema = new SimpleSchema(
  {
    timestamp: Date,
    locale: String,
    countryContext: String,
    remoteAddress: String
  },
  { requiredByDefault: false }
);

export const LastContactSchema = new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String
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
    lastDeliveryAddress: Address,
    lastBillingAddress: Address,
    lastContact: LastContactSchema,
    guest: Boolean,
    tags: Array,
    'tags.$': String,
    avatarId: String,
    services: {
      type: Object,
      optional: true,
      blackbox: true
    },
    roles: Array,
    'roles.$': String,
    ...timestampFields
  },
  { requiredByDefault: false }
);

Meteor.users.attachSchema(UserSchema);

Migrations.add({
  version: 20180529,
  name: 'Move tags and guest from user.profile to user level',
  up() {
    Meteor.users
      .find()
      .fetch()
      .forEach(user => {
        const { profile = {} } = user;
        const displayName =
          profile.displayName ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        Meteor.users.update(
          { _id: user._id },
          {
            $set: {
              tags: user.tags || null,
              guest: !!profile.guest,
              'profile.displayName': displayName
            },
            $unset: {
              'profile.tags': 1,
              'profile.guest': 1,
              'profile.firstName': 1,
              'profile.lastName': 1
            }
          }
        );
      });
  },
  down() {
    Meteor.users
      .find()
      .fetch()
      .forEach(user => {
        const { profile = {} } = user;
        const displayName = profile.displayName || '';
        Meteor.users.update(
          { _id: user._id },
          {
            $set: {
              'profile.tags': user.tags || null,
              'profile.guest': user.guest || false,
              'profile.firstName': displayName.split(' ')[0],
              'profile.lastName': displayName
                .split(' ')
                .splice(-1)
                .join(' ')
            },
            $unset: {
              tags: 1,
              guest: 1,
              'profile.displayName': 1
            }
          }
        );
      });
  }
});

Migrations.add({
  version: 20200103,
  name: 'lastLogin.country to lastLogin.countryContext',
  up() {
    Meteor.users
      .find()
      .fetch()
      .forEach(user => {
        const { lastLogin } = user;
        if (lastLogin) {
          const { country } = lastLogin;
          Meteor.users.update(
            { _id: user._id },
            {
              $set: {
                'lastLogin.countryContext': country
              },
              $unset: {
                'lastLogin.country': 1
              }
            }
          );
        }
      });
  },
  down() {
    Meteor.users
      .find()
      .fetch()
      .forEach(user => {
        const { lastLogin } = user;
        if (lastLogin) {
          const { countryContext } = lastLogin;
          Meteor.users.update(
            { _id: user._id },
            {
              $set: {
                'lastLogin.country': countryContext
              },
              $unset: {
                'lastLogin.countryContext': 1
              }
            }
          );
        }
      });
  }
});

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo('latest');
  });
};
