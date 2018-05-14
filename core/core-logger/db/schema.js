import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Logs } from './collections';

Logs.attachSchema(new SimpleSchema({
  level: { type: String, required: true },
  message: { type: String, required: true },
  userId: { type: String, required: false },
  orderId: { type: String, required: false },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
