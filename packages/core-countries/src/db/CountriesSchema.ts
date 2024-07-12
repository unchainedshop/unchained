import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const CountriesSchema = new SimpleSchema(
  {
    isoCode: { type: String, required: true },
    isActive: Boolean,
    defaultCurrencyCode: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
