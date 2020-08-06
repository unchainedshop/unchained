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
      isActive: { type: Boolean, index: true },
      key: {
        type: String,
        required: true,
        index: true,
        unique: true,
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
      filterId: { type: String, required: true, index: true },
      filterOptionValue: { type: String, index: true },
      locale: { type: String, index: true },
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

export default () => {
  Migrations.migrateTo('latest');
};
