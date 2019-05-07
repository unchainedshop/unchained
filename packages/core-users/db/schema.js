import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Users } from './collections';

const { Address, timestampFields } = Schemas;

Users.attachSchema(
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
