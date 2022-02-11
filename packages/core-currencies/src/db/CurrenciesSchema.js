import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const CurrenciesSchema = new SimpleSchema(
  {
    isoCode: { type: String, required: true },
    isActive: Boolean,
    authorId: { type: String, required: true },
    contractAddress: { type: String, required: false },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
