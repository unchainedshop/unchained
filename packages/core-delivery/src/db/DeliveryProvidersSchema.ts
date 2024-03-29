import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const DeliveryProvidersSchema = new SimpleSchema(
  {
    type: { type: String, required: true },
    adapterKey: { type: String, required: true },
    configuration: { type: Array },
    'configuration.$': { type: Object },
    'configuration.$.key': { type: String },
    'configuration.$.value': { type: String },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
