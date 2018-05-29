import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

const { Address, timestampFields } = Schemas;

Meteor.users.attachSchema(new SimpleSchema({
  emails: Array,
  'emails.$': Object,
  'emails.$.address': String,
  'emails.$.verified': Boolean,
  username: String,
  lastLogin: new SimpleSchema({
    timestamp: Date,
    locale: String,
    country: String,
    remoteAddress: String,
  }),
  profile: new SimpleSchema({
    firstName: String,
    lastName: String,
    birthday: Date,
    phoneMobile: String,
    gender: String,
    address: Address,
  }, { requiredByDefault: false }),
  lastDeliveryAddress: Address,
  lastBillingAddress: Address,
  guest: Boolean,
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
}, { requiredByDefault: false }));

Migrations.add({
  version: 20180529,
  name: 'Move tags and guest from user.profile to user level',
  up() {
    Meteor.users
      .find()
      .fetch()
      .forEach((user) => {
        Meteor.users.update({ _id: user._id }, {
          $set: {
            tags: user.tags || null,
            guest: user.profile.guest || false,
          },
          $unset: {
            'profile.tags': 1,
            'profile.guest': 1,
          },
        });
      });
  },
  down() {
    Meteor.users
      .find()
      .fetch()
      .forEach((user) => {
        Meteor.users.update({ _id: user._id }, {
          $set: {
            'profile.tags': user.tags || null,
            'profile.guest': user.guest || false,
          },
          $unset: {
            tags: 1,
            guest: 1,
          },
        });
      });
  },
});

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo('latest');
  });
};
