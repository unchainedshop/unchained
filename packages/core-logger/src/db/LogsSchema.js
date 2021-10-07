import { SchemaFields } from 'unchained-core-mongodb-utils';
import SimpleSchema from 'simpl-schema';

export const LogsSchema = new SimpleSchema(
  {
    level: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    ...SchemaFields.timestampFields,
  },
  { requiredByDefault: false }
);
