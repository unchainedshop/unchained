import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const CurrenciesSchema = new SimpleSchema(
  {
    isoCode: { type: String, required: true },
    isActive: Boolean,
    contractAddress: { type: String, required: false },
    decimals: { type: Number, required: false },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
