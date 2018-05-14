import { Meteor } from 'meteor/meteor';
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
    guest: Boolean,
    firstName: String,
    lastName: String,
    birthday: Date,
    phoneMobile: String,
    tags: Array,
    'tags.$': String,
  }, { requiredByDefault: false }),
  lastDeliveryAddress: Address,
  lastBillingAddress: Address,
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
