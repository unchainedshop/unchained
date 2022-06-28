import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const AssortmentsSchema = new SimpleSchema(
  {
    authorId: { type: String, required: true },
    isActive: Boolean,
    isBase: Boolean,
    isRoot: Boolean,
    meta: { type: Object, blackbox: true },
    sequence: { type: Number, required: true },
    slugs: Array,
    'slugs.$': String,
    tags: Array,
    'tags.$': String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const AssortmentTextsSchema = new SimpleSchema(
  {
    assortmentId: { type: String, required: true },
    authorId: { type: String, required: true },
    description: String,
    locale: { type: String, required: true },
    slug: String,
    subtitle: String,
    title: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const AssortmentProductsSchema = new SimpleSchema(
  {
    assortmentId: { type: String, required: true },
    authorId: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    productId: { type: String, required: true },
    sortKey: { type: Number, required: true },
    tags: Array,
    'tags.$': String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const AssortmentLinksSchema = new SimpleSchema(
  {
    authorId: { type: String, required: true },
    childAssortmentId: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    parentAssortmentId: { type: String, required: true },
    sortKey: { type: Number, required: true },
    tags: Array,
    'tags.$': String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const AssortmentFiltersSchema = new SimpleSchema(
  {
    assortmentId: { type: String, required: true },
    authorId: { type: String, required: true },
    filterId: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    sortKey: { type: Number, required: true },
    tags: Array,
    'tags.$': String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
