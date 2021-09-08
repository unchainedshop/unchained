import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const LogsSchema = new SimpleSchema(
  {
    level: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
