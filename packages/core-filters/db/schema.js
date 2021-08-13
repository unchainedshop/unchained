import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { Filters, FilterTexts } from './collections';

// eslint-disable-next-line
export const FilterTypes = {
  SWITCH: 'SWITCH',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTI_CHOICE: 'MULTI_CHOICE',
};

Filters.attachSchema(
  new SimpleSchema(
    {
      isActive: Boolean,
      key: {
        type: String,
        required: true,
      },
      type: { type: String, required: true },
      options: Array,
      'options.$': String,
      _cache: { type: Object, blackbox: true },
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

FilterTexts.attachSchema(
  new SimpleSchema(
    {
      filterId: { type: String, required: true },
      filterOptionValue: String,
      locale: String,
      title: String,
      subtitle: String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  Filters.rawCollection().createIndex({ isActive: 1 });
  Filters.rawCollection().createIndex({ key: 1 }, { unique: true });

  // FilterTexts indexes
  FilterTexts.rawCollection().createIndex({ filterId: 1 });
  FilterTexts.rawCollection().createIndex({ filterOptionValue: 1 });
  FilterTexts.rawCollection().createIndex({
    filterId: 1,
    filterOptionValue: 1,
    locale: 1,
  });
};
