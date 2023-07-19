import SimpleSchema from 'simpl-schema';
import { AddressSchema } from './AddressSchema.js';
import { timestampFields } from './commonSchemaFields.js';

const ProfileSchema = new SimpleSchema(
  {
    displayName: String,
    birthday: Date,
    phoneMobile: String,
    gender: String,
    address: AddressSchema,
  },
  { requiredByDefault: false },
);

export const LastLoginSchema = new SimpleSchema(
  {
    timestamp: Date,
    locale: String,
    countryCode: String,
    remoteAddress: String,
    remotePort: String,
    userAgent: String,
  },
  { requiredByDefault: false },
);

export const LastContactSchema = new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String,
  },
  { requiredByDefault: false },
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
    lastBillingAddress: AddressSchema,
    lastContact: LastContactSchema,
    guest: Boolean,
    initialPassword: Boolean,
    tags: Array,
    'tags.$': String,
    avatarId: String,
    meta: {
      type: Object,
      optional: true,
      blackbox: true,
    },
    services: {
      type: Object,
      optional: true,
      blackbox: true,
    },
    roles: Array,
    'roles.$': String,
    ...timestampFields,
  },
  { requiredByDefault: false },
);
