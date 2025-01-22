export const SimpleProduct = {
  _id: 'simpleproduct',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 0,
  slugs: ['old-slug-de', 'slug-de', 'slug-fr', 'search-purpose'],
  updated: new Date('2019-09-10T14:29:37.015+0000'),
  published: new Date('2019-07-30T09:23:57.329+0000'),
  warehousing: {
    sku: 'SKU',
    baseUnit: 'ST',
  },
  tags: ['tag-1', 'tag-2', 'highlight', 'test-tag'],
  commerce: {
    pricing: [
      {
        amount: 10000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  supply: {
    weightInGram: 1570,
    heightInMillimeters: 250,
    lengthInMillimeters: 300,
    widthInMillimeters: 400,
  },
};

export const SimpleProductDraft = {
  _id: 'simpleproduct_draft',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'SIMPLE_PRODUCT',
  status: null,
  sequence: 0,
  slugs: ['old-slug-de', 'slug-de', 'slug-fr', 'search-purpose'],
  updated: new Date('2019-09-10T14:29:37.015+0000'),
  published: new Date('2019-07-30T09:23:57.329+0000'),
  warehousing: {
    sku: 'SKU',
    baseUnit: 'ST',
  },
  tags: ['tag-1', 'tag-2', 'highlight', 'test-tag'],
  commerce: {
    pricing: [
      {
        amount: 10000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  supply: {
    weightInGram: 1570,
    heightInMillimeters: 250,
    lengthInMillimeters: 300,
    widthInMillimeters: 400,
  },
};

export const ConfigurableProduct = {
  _id: 'configurable-product-id',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'CONFIGURABLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 3,
  slugs: ['old-slug-de', 'slug-de', 'slug-fr', 'test-slug'],
  updated: new Date('2019-09-10T14:29:37.015+0000'),
  published: new Date('2019-07-30T09:23:57.329+0000'),
  warehousing: {
    sku: 'SKU',
    baseUnit: 'ST',
  },
  tags: ['tag-1', 'tag-2', 'highlight'],
  commerce: {
    pricing: [
      {
        amount: 10000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  supply: {
    weightInGram: 1570,
    heightInMillimeters: 250,
    lengthInMillimeters: 300,
    widthInMillimeters: 400,
  },
};

export const SimpleProductBundle = {
  _id: 'simpleproduct-bundle',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'BUNDLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 2,
  slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
  updated: new Date('2019-09-10T14:29:37.015+0000'),
  published: new Date('2019-07-30T09:23:57.329+0000'),
  warehousing: {
    sku: 'SKU',
    baseUnit: 'ST-bundle',
  },
  tags: ['tag-1', 'tag-2', 'highlight'],
  commerce: {
    pricing: [
      {
        amount: 10000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  supply: {
    weightInGram: 1570,
    heightInMillimeters: 250,
    lengthInMillimeters: 300,
    widthInMillimeters: 400,
  },
};

export const UnpublishedProduct = {
  ...SimpleProduct,
  _id: 'un-published',
  sequence: 1,
  status: null,
  published: null,
};

export const PlanProduct = {
  _id: 'plan-product',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'PLAN_PRODUCT',
  status: 'ACTIVE',
  sequence: 20,
  slugs: ['plan', 'test-slug'],
  updated: new Date('2019-09-10T14:29:37.015+0000'),
  published: new Date('2019-07-30T09:23:57.329+0000'),
  commerce: {
    pricing: [
      {
        amount: 10000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  plan: {
    billingInterval: 'WEEKS',
    billingIntervalCount: 1,
    usageCalculationType: 'LICENSED',
    trialInterval: null,
    trialIntervalCount: null,
  },
};

export const GermanProductText = {
  _id: 'german',
  locale: 'de',
  productId: 'simpleproduct',
  slug: 'slug-de',
  title: 'simple product title de',
  updated: new Date('2019-09-10T14:28:46.103+0000'),
  brand: 'brand-de',
  description: 'text-de',
  labels: ['label-de-1', 'label-de-2'],
  subtitle: 'subtitle-de',
  vendor: 'vendor-de',
};

export const GermanPlanProductText = {
  ...GermanProductText,
  productId: 'plan-product',
  slug: 'plan',
  title: 'weekly',
};

export const FrenchProductText = {
  _id: 'french',
  locale: 'fr',
  productId: 'simpleproduct',
  labels: ['label-fr-1'],
  slug: 'slug-fr',
  title: 'simple product title fr',
  updated: new Date('2019-09-10T14:28:46.105+0000'),
  brand: 'brand-fr-1',
  description: 'text-fr-1',
  subtitle: 'subtitle-fr',
  vendor: 'vendor-fr-1',
};

export const JpegMedia = {
  _id: 'product-media%2Fe1674b3a9b69990d532d247382207005a276bb859a22829777ecaa5d6d3d036d',
  url: 'https://console.minio.dev.shared.ucc.dev/unchained-test-bucket/product-media/e1674b3a9b69990d532d247382207005a276bb859a22829777ecaa5d6d3d036d.png',
  name: 'Screenshot from 2021-09-07 21-20-22.png',
  meta: {
    mediaId: '4CZA6tzAuKuJx5WQc',
  },
  size: '779663',
  type: 'image/jpeg',
  expires: new Date('2021-10-12T18:08:58.218Z'),
  created: new Date('2021-10-12T18:07:31.818Z'),
};

const GridfsMedia = {
  _id: '7FVJLp22ye9zNNBGEosF9X-screenshot-from-2024-11-26-16-13-44.png',
  created: new Date('2021-10-12T18:07:31.818Z'),
  path: 'product-media',
  expires: null,
  name: 'Screenshot from 2024-11-26 16-13-44.png',
  size: 104467,
  type: 'image/png',
  url: '/gridfs/product-media/7FVJLp22ye9zNNBGEosF9X-screenshot-from-2024-11-26-16-13-44.png',
  meta: {
    productId: 'configurable-product-id',
    userId: 'user',
    isPrivate: true,
  },
  updated: new Date('2021-10-12T18:07:31.818Z'),
};

export const JpegProductMedia = {
  _id: 'jpeg-product',
  mediaId: 'product-media%2Fe1674b3a9b69990d532d247382207005a276bb859a22829777ecaa5d6d3d036d',
  tags: [],
  sortKey: 1,
  productId: 'simpleproduct',
  created: new Date('2019-09-10T14:29:01.093+0000'),
};
export const GridFsProductMedia = {
  _id: 'gridfs-product-media',
  mediaId: '7FVJLp22ye9zNNBGEosF9X-screenshot-from-2024-11-26-16-13-44.png',
  tags: [],
  sortKey: 1,
  productId: 'configurable-product-id',
  created: new Date('2019-09-10T14:29:01.093+0000'),
};

export const GermanJpegProductMediaText = {
  _id: 'german-jpeg-product',
  locale: 'de',
  productMediaId: 'jpeg-product',
  subtitle: 'product-media-subtitle-de',
  title: 'product-media-title-de',
  updated: new Date('2019-09-10T14:42:16.175+0000'),
};

export const FrenchJpegProductMediaText = {
  _id: 'french-jpeg-product',
  locale: 'fr',
  productMediaId: 'jpeg-product',
  subtitle: 'product-media-subtitle-fr',
  title: 'product-media-title-fr',
  updated: new Date('2019-09-10T14:42:16.177+0000'),
};

export const SimpleProductReview = {
  _id: 'product-review',
  productId: 'simpleproduct',
  authorId: 'admin',
  rating: 2,
  title: 'Title of my Review',
  review: 'Explanatory comment why I love or hate this product',
  updated: new Date('2019-09-10T14:42:16.177+0000'),
  created: new Date('2019-09-10T14:42:16.177+0000'),
  votes: [],
};
export const ProductVariationTexts = [
  {
    _id: 'product-color-variation-1-en-text',
    productVariationId: 'product-color-variation-1',
    locale: 'en',
    title: 'product color variation title',
    subtitle: null,
  },
  {
    _id: 'product-color-variation-1-de-text',
    productVariationId: 'product-color-variation-1',
    locale: 'de',
    title: 'product color variation title de',
    subtitle: null,
  },
  {
    _id: 'product-text-variation-2-en-text',
    productVariationId: 'product-text-variation-2',
    locale: 'en',
    title: 'product text variation title',
    subtitle: null,
  },
  {
    _id: 'product-text-variation-2-de-text',
    productVariationId: 'product-text-variation-2',
    locale: 'de',
    title: 'product text variation title de',
    subtitle: null,
  },
];

export const ProductVariations = [
  {
    _id: 'product-color-variation-1',
    productId: 'proxy-product',
    type: 'COLOR',
    key: 'color-variant',
    options: ['color-variant-red', 'color-variant-blue'],
  },
  {
    _id: 'product-text-variation-2',
    productId: 'proxy-product',
    type: 'TEXT',
    key: 'text-variant',
    options: ['text-variant-a', 'text-variant-b', 'variation-option-1-value'],
  },
];

export const ProxySimpleProduct1 = {
  _id: 'proxy-simple-product-1',
  created: new Date('2021-02-24T14:03:28.905Z'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 11,
  slugs: ['simple-product-1'],
  updated: new Date('2021-02-25T17:54:42.559Z'),
  published: new Date('2021-02-24T14:03:32.291Z'),
  commerce: {
    pricing: [
      {
        amount: 2000000,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 1500000,
        maxQuantity: 7,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 1000000,
        maxQuantity: 10,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const ProxySimpleProduct2 = {
  _id: 'proxy-simple-product-2',
  created: new Date('2021-02-25T17:51:16.359Z'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 12,
  slugs: ['simple-product-2'],
  updated: new Date('2021-02-25T20:32:26.086Z'),
  commerce: {
    pricing: [
      {
        amount: 500000,
        maxQuantity: 1,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 400000,
        maxQuantity: 5,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 300000,
        maxQuantity: 10,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  published: new Date('2021-02-25T17:51:37.677Z'),
};

export const ProxyPlanProduct1 = {
  _id: 'CbBSxR6wcAbBtubaB',
  created: new Date('2021-02-25T21:18:02.851Z'),
  type: 'PLAN_PRODUCT',
  status: 'ACTIVE',
  sequence: 14,
  slugs: ['plan-product-1'],
  updated: new Date('2021-02-25T21:19:17.247Z'),
  published: new Date('2021-02-25T21:18:06.969Z'),
  commerce: {
    pricing: [
      {
        amount: 30000000,
        maxQuantity: 1,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 20000000,
        maxQuantity: 2,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 10000000,
        maxQuantity: 3,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const ProxyPlanProduct2 = {
  _id: 'jttYMzKFkqSfimsFi',
  created: new Date('2021-02-25T21:19:45.376Z'),
  type: 'PLAN_PRODUCT',
  status: 'ACTIVE',
  sequence: 15,
  slugs: ['plan-product-2'],
  updated: new Date('2021-02-25T21:20:41.210Z'),
  published: new Date('2021-02-25T21:19:50.870Z'),
  commerce: {
    pricing: [
      {
        amount: 10000000,
        maxQuantity: 1,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 75000000,
        maxQuantity: 5,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 5000000,
        maxQuantity: 10,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const ProxyPlanProduct3 = {
  _id: 'SLQkYqmA8SttWXwsz',
  created: new Date('2021-02-25T21:21:06.691Z'),
  type: 'PLAN_PRODUCT',
  status: 'ACTIVE',
  sequence: 16,
  slugs: ['plan-product-3'],
  updated: new Date('2021-02-25T21:22:00.501Z'),
  published: new Date('2021-02-25T21:21:09.956Z'),
  commerce: {
    pricing: [
      {
        amount: 1000000,
        maxQuantity: 1,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 750000,
        maxQuantity: 5,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 5000000,
        maxQuantity: 10,
        isTaxable: true,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const ProxySimpleProduct3 = {
  _id: 'E8Y58rvx8HX2bTYNN',
  created: new Date('2021-02-25T17:55:03.018Z'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 13,
  slugs: ['simple-product-3'],
  updated: new Date('2021-02-25T20:33:07.993Z'),
  published: new Date('2021-02-25T17:55:07.303Z'),
  commerce: {
    pricing: [
      {
        amount: 10000000,
        maxQuantity: 1,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 5000000,
        maxQuantity: 5,
        isTaxable: true,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const ProxyProduct = {
  _id: 'proxy-product',
  created: new Date('2021-02-24T14:02:42.208Z'),
  type: 'CONFIGURABLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 10,
  slugs: ['configurable-product'],
  updated: new Date('2021-02-25T20:33:23.191Z'),
  published: new Date('2021-02-24T14:02:51.039Z'),
  proxy: {
    assignments: [
      {
        vector: {
          'color-variant': 'color-variant-red',
          'text-variant': 'text-variant-a',
        },
        productId: ProxySimpleProduct1._id,
      },
      {
        vector: {
          'color-variant': 'color-variant-blue',
          'text-variant': 'text-variant-a',
        },
        productId: ProxySimpleProduct2._id,
      },
      {
        vector: {
          'color-variant': 'color-variant-red',
          'text-variant': 'text-variant-b',
        },
        productId: ProxySimpleProduct3._id,
      },
      {
        vector: {
          'color-variant': 'color-variant-blue',
          'text-variant': 'text-variant-b',
        },
        productId: ProxyPlanProduct1._id,
      },
    ],
  },
};

export default async function seedProducts(db) {
  await db
    .collection('products')
    .insertMany([
      SimpleProduct,
      SimpleProductDraft,
      UnpublishedProduct,
      SimpleProductBundle,
      ConfigurableProduct,
      ProxySimpleProduct1,
      ProxySimpleProduct2,
      ProxySimpleProduct3,
      ProxyPlanProduct1,
      ProxyPlanProduct2,
      ProxyPlanProduct3,
      ProxyProduct,
      PlanProduct,
    ]);

  await db.collection('product_reviews').findOrInsertOne(SimpleProductReview);
  await db.collection('product_texts').findOrInsertOne(GermanProductText);
  await db.collection('product_texts').findOrInsertOne(FrenchProductText);
  await db.collection('product_media').findOrInsertOne(JpegProductMedia);
  await db.collection('product_media').findOrInsertOne(GridFsProductMedia);
  await db.collection('product_media_texts').findOrInsertOne(GermanJpegProductMediaText);
  await db.collection('product_media_texts').findOrInsertOne(FrenchJpegProductMediaText);

  await db.collection('media_objects').findOrInsertOne(JpegMedia);
  await db.collection('media_objects').findOrInsertOne(GridfsMedia);
  await db.collection('product_texts').findOrInsertOne(GermanPlanProductText);
  await db.collection('product_variations').insertMany(ProductVariations);
  await db.collection('product_variation_texts').insertMany(ProductVariationTexts);
}
