import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';
import * as Collections from './collections';

Collections.Assortments.attachSchema(
  new SimpleSchema(
    {
      isActive: { type: Boolean, index: true },
      isRoot: { type: Boolean, index: true },
      sequence: { type: Number, required: true, index: true },
      isBase: Boolean,
      slugs: { type: Array, index: true },
      'slugs.$': String,
      tags: { type: Array, index: true },
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      _cachedProductIds: Array,
      '_cachedProductIds.$': String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Collections.AssortmentTexts.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true, index: true },
      locale: { type: String, required: true, index: true },
      title: String,
      subtitle: String,
      description: String,
      slug: { type: String, index: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Collections.AssortmentProducts.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true, index: true },
      productId: { type: String, required: true, index: true },
      sortKey: { type: Number, required: true },
      tags: { type: Array, index: true },
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Collections.AssortmentLinks.attachSchema(
  new SimpleSchema(
    {
      parentAssortmentId: { type: String, required: true, index: true },
      childAssortmentId: { type: String, required: true, index: true },
      sortKey: { type: Number, required: true },
      tags: { type: Array, index: true },
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Collections.AssortmentFilters.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true, index: true },
      filterId: { type: String, required: true, index: true },
      sortKey: { type: Number, required: true },
      tags: { type: Array, index: true },
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200728.1,
  name: 'Add default authorId to assortments',
  up() {
    Collections.Assortments.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.Assortments.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
    Collections.AssortmentTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentTexts.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
    Collections.AssortmentProducts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentProducts.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
    Collections.AssortmentLinks.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentLinks.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          },
        );
      });
    Collections.AssortmentFilters.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentFilters.update(
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
    Collections.Assortments.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.Assortments.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
    Collections.AssortmentTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentTexts.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
    Collections.AssortmentProducts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentProducts.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
    Collections.AssortmentLinks.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentLinks.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          },
        );
      });
    Collections.AssortmentFilters.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentFilters.update(
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
