export const SimpleProduct = {
  _id: 'simpleproduct',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 0,
  authorId: 'admin',
  slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
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

export const UnpublishedProduct = {
  ...SimpleProduct,
  _id: 'un-published',
  status: null,
  published: null,
};

export const PlanProduct = {
  _id: 'plan-product',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'PLAN_PRODUCT',
  status: 'ACTIVE',
  sequence: 0,
  authorId: 'admin',
  slugs: ['plan'],
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
    billingInterval: 'WEEK',
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
  title: 'weekly subscription',
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
  _id: 'jpeg',
  name: 'iu.jpeg',
  extension: 'jpeg',
  ext: 'jpeg',
  extensionWithDot: '.jpeg',
  path: 'assets/app/uploads/media/jpeg.jpeg',
  meta: {},
  type: 'image/jpeg',
  mime: 'image/jpeg',
  'mime-type': 'image/jpeg',
  size: 1745971,
  userId: 'admin',
  versions: {
    original: {
      path: 'assets/app/uploads/media/jpeg.jpeg',
      size: 1745971,
      type: 'image/jpeg',
      extension: 'jpeg',
    },
  },
  _downloadRoute: '/cdn/storage',
  _collectionName: 'media',
  isVideo: false,
  isAudio: false,
  isImage: true,
  isText: false,
  isJSON: false,
  isPDF: false,
  _storagePath: 'assets/app/uploads/media',
};

export const JpegProductMedia = {
  _id: 'jpeg-product',
  mediaId: 'jpeg',
  tags: [],
  sortKey: 1,
  productId: 'simpleproduct',
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

export const ProductVariations = [
  {
    _id: 'product-color-variation-1',
    texts: {
      _id: 'variation-color-1',
      locale: 'en',
      title: 'product color variation title',
      subtitle: null,
    },
    type: 'COLOR',
    key: 'key-3',
    options: [],
  },
  {
    _id: 'product-text-variation-3',
    texts: {
      _id: 'variation-text-3',
      locale: 'en',
      title: 'product text variation title ',
      subtitle: null,
    },
    type: 'TEXT',
    key: 'key-3',
    options: [],
  },
];

export default async function seedProducts(db) {
  await db.collection('product_texts').createIndex({
    title: 'text',
  });
  await db
    .collection('products')
    .insertMany([SimpleProduct, UnpublishedProduct]);
  await db.collection('product_reviews').findOrInsertOne(SimpleProductReview);
  await db.collection('product_texts').findOrInsertOne(GermanProductText);
  await db.collection('product_texts').findOrInsertOne(FrenchProductText);
  await db.collection('product_media').findOrInsertOne(JpegProductMedia);
  await db
    .collection('product_media_texts')
    .findOrInsertOne(GermanJpegProductMediaText);
  await db
    .collection('product_media_texts')
    .findOrInsertOne(FrenchJpegProductMediaText);

  await db.collection('media').findOrInsertOne(JpegMedia);
  await db.collection('products').findOrInsertOne(PlanProduct);
  await db.collection('product_texts').findOrInsertOne(GermanPlanProductText);
  await db.collection('product_variations').insertMany(ProductVariations);
}
