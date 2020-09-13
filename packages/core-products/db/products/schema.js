import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Products, ProductTexts } from './collections';

export const ProductTypes = {
  SimpleProduct: 'SIMPLE_PRODUCT',
  ConfigurableProduct: 'CONFIGURABLE_PRODUCT',
  BundleProduct: 'BUNDLE_PRODUCT',
  PlanProduct: 'PLAN_PRODUCT',
};

export const ProductStatus = {
  DRAFT: null,
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
};

const ProductCommerceSchema = new SimpleSchema(
  {
    salesUnit: String,
    salesQuantityPerUnit: String,
    pricing: Array,
    'pricing.$': Object,
    'pricing.$.isTaxable': Boolean,
    'pricing.$.isNetPrice': Boolean,
    'pricing.$.countryCode': String,
    'pricing.$.currencyCode': String,
    'pricing.$.amount': Number,
    'pricing.$.maxQuantity': Number,
  },
  { requiredByDefault: false },
);

const ProductWarehousingSchema = new SimpleSchema(
  {
    baseUnit: String,
    sku: { type: String, index: true },
  },
  { requiredByDefault: false },
);

const ProductSupplySchema = new SimpleSchema(
  {
    weightInGram: Number,
    heightInMillimeters: Number,
    lengthInMillimeters: Number,
    widthInMillimeters: Number,
  },
  { requiredByDefault: false },
);

const ProductPlanSchema = new SimpleSchema(
  {
    billingInterval: String,
    billingIntervalCount: Number,
    usageCalculationType: String,
    trialInterval: String,
    trialIntervalCount: Number,
  },
  { requiredByDefault: false },
);

const ProductProxySchema = new SimpleSchema(
  {
    assignments: Array,
    'assignments.$': Object,
    'assignments.$.vector': { type: Object, blackbox: true },
    'assignments.$.productId': String,
  },
  { requiredByDefault: false },
);

const ProductConfigurationSchema = new SimpleSchema({
  key: String,
  value: String,
});

const ProductBundleItemSchema = new SimpleSchema({
  productId: String,
  quantity: Number,
  configuration: {
    type: Array,
    defaultValue: [],
  },
  'configuration.$': ProductConfigurationSchema,
});

Products.attachSchema(
  new SimpleSchema(
    {
      sequence: { type: Number, required: true },
      slugs: Array,
      'slugs.$': String,
      type: {
        type: String,
        allowedValues: Object.values(ProductTypes),
        required: true,
      },
      status: String,
      authorId: { type: String, required: true },
      published: Date,
      tags: Array,
      'tags.$': String,
      commerce: ProductCommerceSchema,
      warehousing: ProductWarehousingSchema,
      supply: ProductSupplySchema,
      proxy: ProductProxySchema,
      plan: ProductPlanSchema,
      bundleItems: {
        type: Array,
        optional: true,
      },
      'bundleItems.$': ProductBundleItemSchema,
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Products.rawCollection().createIndex({ sequence: 1 });
Products.rawCollection().createIndex({ slugs: 1 });
Products.rawCollection().createIndex({ status: 1 });
Products.rawCollection().createIndex({ tags: 1 });

ProductTexts.attachSchema(
  new SimpleSchema(
    {
      productId: { type: String, required: true },
      locale: { type: String, required: true },
      authorId: { type: String, required: true },
      vendor: String,
      brand: String,
      title: String,
      slug: String,
      subtitle: String,
      description: String,
      labels: Array,
      'labels.$': String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

ProductTexts.rawCollection().createIndex({ productId: 1 });
ProductTexts.rawCollection().createIndex({ locale: 1 });
ProductTexts.rawCollection().createIndex({ slug: 1 });
