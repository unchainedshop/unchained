import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import * as Collections from './collections';

Collections.Assortments.attachSchema(new SimpleSchema({
  isActive: Boolean,
  isBase: Boolean,
  isRoot: Boolean,
  sequence: { type: Number, required: true, index: true },
  slugs: { type: Array, index: true },
  'slugs.$': String,
  tags: { type: Array, index: true },
  'tags.$': String,
  meta: { type: Object, blackbox: true },
  _cachedProductIds: Array,
  '_cachedProductIds.$': String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.AssortmentTexts.attachSchema(new SimpleSchema({
  assortmentId: { type: String, required: true, index: true },
  locale: { type: String, required: true, index: true },
  title: String,
  subtitle: String,
  description: String,
  slug: { type: String, index: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.AssortmentProducts.attachSchema(new SimpleSchema({
  assortmentId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  sortKey: { type: Number, required: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.AssortmentLinks.attachSchema(new SimpleSchema({
  parentAssortmentId: { type: String, required: true, index: true },
  childAssortmentId: { type: String, required: true, index: true },
  sortKey: { type: Number, required: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.AssortmentFilters.attachSchema(new SimpleSchema({
  assortmentId: { type: String, required: true, index: true },
  filterId: { type: String, required: true, index: true },
  sortKey: { type: Number, required: true },
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
