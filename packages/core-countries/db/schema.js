import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Countries } from './collections';

Countries.attachSchema(
  new SimpleSchema(
    {
      isoCode: {
        type: String,
        required: true,
      },
      isActive: Boolean,
      isBase: Boolean,
      authorId: { type: String, required: true },
      defaultCurrencyId: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);
Countries.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
