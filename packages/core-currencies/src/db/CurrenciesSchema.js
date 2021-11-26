import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const CurrencySchema = new SimpleSchema(
  {
    isoCode: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    authorId: { type: String, required: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
