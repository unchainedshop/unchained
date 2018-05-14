import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import * as Collections from './collections';

export const ProductTypes = {
  SimpleProduct: 'SIMPLE_PRODUCT',
  ConfigurableProduct: 'CONFIGURABLE_PRODUCT',
};

export const ProductVariationType = {
  COLOR: 'COLOR',
  TEXT: 'TEXT',
};

export const ProductStatus = {
  DRAFT: null,
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
};

const ProductCommerceSchema = new SimpleSchema({
  pricing: Array,
  'pricing.$': Object,
  'pricing.$.isTaxable': Boolean,
  'pricing.$.isNetPrice': Boolean,
  'pricing.$.countryCode': String,
  'pricing.$.currencyCode': String,
  'pricing.$.amount': Number,
}, { requiredByDefault: false });

const ProductWarehousingSchema = new SimpleSchema({
  sku: String,
  maxAllowedQuantityPerOrder: Number,
  allowOrderingIfNoStock: Boolean,
}, { requiredByDefault: false });

const ProductSupplySchema = new SimpleSchema({
  weightInGram: Number,
  heightInMillimeters: Number,
  lengthInMillimeters: Number,
  widthInMillimeters: Number,
}, { requiredByDefault: false });

const ProductProxySchema = new SimpleSchema({
  assignments: Array,
  'assignments.$': Object,
  'assignments.$.vector': { type: Object, blackbox: true },
  'assignments.$.productId': String,
}, { requiredByDefault: false });

Collections.Products.attachSchema(new SimpleSchema({
  sequence: { type: Number, required: true, index: true },
  slugs: { type: Array, index: true },
  'slugs.$': String,
  type: { type: String, required: true },
  status: { type: String, index: true },
  authorId: { type: String, required: true },
  published: Date,
  tags: { type: Array, index: true },
  'tags.$': String,
  commerce: ProductCommerceSchema,
  warehousing: ProductWarehousingSchema,
  supply: ProductSupplySchema,
  proxy: ProductProxySchema,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.ProductTexts.attachSchema(new SimpleSchema({
  productId: { type: String, required: true, index: true },
  locale: { type: String, required: true, index: true },
  vendor: String,
  title: String,
  slug: { type: String, index: true },
  subtitle: String,
  description: String,
  labels: Array,
  'labels.$': String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.ProductMedia.attachSchema(new SimpleSchema({
  mediaId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  sortKey: { type: Number, required: true },
  tags: { type: Array, index: true },
  'tags.$': String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.ProductMediaTexts.attachSchema(new SimpleSchema({
  productMediaId: { type: String, required: true, index: true },
  locale: { type: String, index: true },
  title: String,
  subtitle: String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.ProductVariations.attachSchema(new SimpleSchema({
  productId: { type: String, required: true, index: true },
  key: String,
  type: String,
  options: Array,
  'options.$': String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));

Collections.ProductVariationTexts.attachSchema(new SimpleSchema({
  productVariationId: { type: String, required: true, index: true },
  productVariationOptionValue: String,
  locale: { type: String, index: true },
  title: String,
  subtitle: String,
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
