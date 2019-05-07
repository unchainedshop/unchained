import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Logs } from './collections';

Logs.attachSchema(
  new SimpleSchema(
    {
      level: { type: String, required: true },
      message: { type: String, required: true },
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);
