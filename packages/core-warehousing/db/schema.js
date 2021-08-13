import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { WarehousingProviders } from './collections';

// eslint-disable-next-line
export const WarehousingProviderType = {
  PHYSICAL: 'PHYSICAL',
};

WarehousingProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: Array,
      'configuration.$': Object,
      'configuration.$.key': String,
      'configuration.$.value': String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  WarehousingProviders.rawCollection().createIndex({ type: 1 });
};
