import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const CountrySchema = new SimpleSchema(
  {
    isoCode: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    authorId: { type: String, required: true },
    defaultCurrencyId: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
