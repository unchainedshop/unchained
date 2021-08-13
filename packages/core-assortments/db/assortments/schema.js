import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import * as Collections from './collections';

Collections.Assortments.attachSchema(
  new SimpleSchema(
    {
      isActive: Boolean,
      isRoot: Boolean,
      sequence: { type: Number, required: true },
      isBase: Boolean,
      slugs: Array,
      'slugs.$': String,
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      _cachedProductIds: Array,
      '_cachedProductIds.$': String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Collections.AssortmentTexts.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true },
      locale: { type: String, required: true },
      title: String,
      subtitle: String,
      description: String,
      slug: String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Collections.AssortmentProducts.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true },
      productId: { type: String, required: true },
      sortKey: { type: Number, required: true },
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Collections.AssortmentLinks.attachSchema(
  new SimpleSchema(
    {
      parentAssortmentId: { type: String, required: true },
      childAssortmentId: { type: String, required: true },
      sortKey: { type: Number, required: true },
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Collections.AssortmentFilters.attachSchema(
  new SimpleSchema(
    {
      assortmentId: { type: String, required: true },
      filterId: { type: String, required: true },
      sortKey: { type: Number, required: true },
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  // Assortment Indexes
  Collections.Assortments.rawCollection().createIndex({ isActive: 1 });
  Collections.Assortments.rawCollection().createIndex({ isRoot: 1 });
  Collections.Assortments.rawCollection().createIndex({ squence: 1 });
  Collections.Assortments.rawCollection().createIndex({ slugs: 1 });
  Collections.Assortments.rawCollection().createIndex({ tags: 1 });

  // AssortmentTexts indexe
  Collections.AssortmentTexts.rawCollection().createIndex({
    assortmentId: 1,
  });
  Collections.AssortmentTexts.rawCollection().createIndex({ locale: 1 });
  Collections.AssortmentTexts.rawCollection().createIndex({ slug: 1 });
  Collections.AssortmentTexts.rawCollection().createIndex({
    locale: 1,
    assortmentId: 1,
  });
  Collections.AssortmentTexts.rawCollection().createIndex({
    title: 'text',
    subtitle: 'text',
    vendor: 'text',
    brand: 'text',
  });

  // AssortmentProducts indexes
  Collections.AssortmentProducts.rawCollection().createIndex({
    assortmentId: 1,
  });
  Collections.AssortmentProducts.rawCollection().createIndex({
    productId: 1,
  });
  Collections.AssortmentProducts.rawCollection().createIndex({
    tags: 1,
  });

  // AssortmentLinks indices
  Collections.AssortmentLinks.rawCollection().createIndex({
    parentAssortmentId: 1,
  });
  Collections.AssortmentLinks.rawCollection().createIndex({
    childAssortmentId: 1,
  });
  Collections.AssortmentLinks.rawCollection().createIndex({
    tags: 1,
  });

  // AssortmentFilter indices
  Collections.AssortmentFilters.rawCollection().createIndex({
    assortmentId: 1,
  });
  Collections.AssortmentFilters.rawCollection().createIndex({
    filterId: 1,
  });
  Collections.AssortmentFilters.rawCollection().createIndex({
    tags: 1,
  });
};
