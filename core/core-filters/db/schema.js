import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Filters } from './collections';

export const FilterType = { // eslint-disable-line
  PHYSICAL: 'PHYSICAL',
};

Filters.attachSchema(new SimpleSchema({
  type: { type: String, required: true, index: true },
  adapterKey: { type: String, required: true },
  configuration: { type: Array },
  'configuration.$': { type: Object },
  'configuration.$.key': { type: String },
  'configuration.$.value': { type: String },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
