import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export enum ProductTypes {
  SimpleProduct = 'SIMPLE_PRODUCT',
  ConfigurableProduct = 'CONFIGURABLE_PRODUCT',
  BundleProduct = 'BUNDLE_PRODUCT',
  PlanProduct = 'PLAN_PRODUCT',
  TokenizedProduct = 'TOKENIZED_PRODUCT',
}

const ProductCommerceSchema = new SimpleSchema(
  {
    salesUnit: String,
    salesQuantityPerUnit: String,
    defaultOrderQuantity: Number,
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
    sku: String,
  },
  { requiredByDefault: false },
);

const ProductTokenizationSchema = new SimpleSchema(
  {
    contractAddress: String,
    contractStandard: String,
    ercMetadataProperties: { type: Object, blackbox: true, optional: true },
    tokenId: String,
    supply: Number,
  },
  { requiredByDefault: true },
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

export const ProductsSchema = new SimpleSchema(
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
    tokenization: ProductTokenizationSchema,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const ProductTextsSchema = new SimpleSchema(
  {
    productId: { type: String, required: true },
    locale: { type: String, required: true },
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
);
