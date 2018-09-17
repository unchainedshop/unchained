import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Filters, FilterTexts } from './collections';

export const FilterTypes = { // eslint-disable-line
  SWITCH: 'SWITCH',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTI_CHOICE: 'MULTI_CHOICE',
};

Filters.attachSchema(new SimpleSchema({
  key: {
    type: String, required: true, index: true, unique: true,
  },
  type: { type: String, required: true },
  options: Array,
  'options.$': String,
  _cache: { type: Object, blackbox: true },
  meta: { type: Object, blackbox: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

FilterTexts.attachSchema(new SimpleSchema({
  filterId: { type: String, required: true, index: true },
  filterOptionValue: String,
  locale: { type: String, index: true },
  title: String,
  subtitle: String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
