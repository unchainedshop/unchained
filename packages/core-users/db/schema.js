import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

const { Address, timestampFields } = Schemas;

Meteor.users.attachSchema(
  new SimpleSchema(
    {
      emails: Array,
      'emails.$': Object,
      'emails.$.address': String,
      'emails.$.verified': Boolean,
      username: String,
      lastLogin: new SimpleSchema({
        timestamp: Date,
        locale: String,
        country: String,
        remoteAddress: String
      }),
      profile: new SimpleSchema(
        {
          displayName: String,
          birthday: Date,
          phoneMobile: String,
          gender: String,
          address: Address
        },
        { requiredByDefault: false }
      ),
      lastDeliveryAddress: Address,
      lastBillingAddress: Address,
      lastContact: new SimpleSchema(
        {
          telNumber: String,
          emailAddress: String
        },
        { requiredByDefault: false }
      ),
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
  )
);

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
