import SimpleSchema from 'simpl-schema';
import { timestampFields, contextFields, logFields } from './commonSchemaFields.js';
import { AddressSchema } from './AddressSchema.js';
import { ContactSchema } from './ContactSchema.js';
import { UserSchema } from './UsersSchema.js';

const Schemas = {
  timestampFields,
  contextFields,
  logFields,
  Address: AddressSchema,
  Contact: ContactSchema,
  User: UserSchema,
};

export { Schemas };

export type { SimpleSchema };
