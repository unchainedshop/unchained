import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Languages } from './collections';

Languages.attachSchema(new SimpleSchema({
  isoCode: {
    type: String, required: true, index: true, unique: true,
  },
  isActive: Boolean,
  isBase: Boolean,
  authorId: { type: String, required: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
