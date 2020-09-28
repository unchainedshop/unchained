import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

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
    { requiredByDefault: false },
  ),
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
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200728.3,
  name: 'Add default authorId to filters',
  up() {
    Filters.find()
      .fetch()
      .forEach(({ _id }) => {
        Filters.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
    FilterTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        FilterTexts.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
  },
  down() {
    Filters.find()
      .fetch()
      .forEach(({ _id }) => {
        Filters.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
    FilterTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        FilterTexts.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
  },
});

Migrations.add({
  version: 20200914.5,
  name: 'drop filters related indexes',
  up() {
    Filters.rawCollection()
      .dropIndexes()
      .catch(() => {});
    FilterTexts.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  Filters.rawCollection().createIndex({ isActive: 1 });
  Filters.rawCollection().createIndex({ key: 1 }, { unique: true });

  // FilterTexts indexes
  FilterTexts.rawCollection().createIndex({ filterId: 1 });
  FilterTexts.rawCollection().createIndex({ filterOptionValue: 1 });
  FilterTexts.rawCollection().createIndex({ locale: 1 });
};
