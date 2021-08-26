import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { DeliveryProviders } from './collections';

export const DeliveryProviderType = {
  // eslint-disable-line
  SHIPPING: 'SHIPPING',
  PICKUP: 'PICKUP',
};

DeliveryProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  DeliveryProviders.rawCollection().createIndex({ type: 1 });
};
