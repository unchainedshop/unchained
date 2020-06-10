import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Currencies } from './collections';

Currencies.attachSchema(
  new SimpleSchema(
    {
      isoCode: {
        type: String,
        required: true,
        index: true,
        unique: true,
      },
      isActive: Boolean,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);
