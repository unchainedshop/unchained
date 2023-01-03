import SimpleSchema from 'simpl-schema';
import { Schemas } from '@unchainedshop/utils';

export const WarehousingProvidersSchema = new SimpleSchema(
  {
    type: { type: String, required: true },
    adapterKey: { type: String, required: true },
    configuration: Array,
    'configuration.$': Object,
    'configuration.$.key': String,
    'configuration.$.value': String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
