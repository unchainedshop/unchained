import { SimpleProduct } from './products';
import { MultiChoiceFilter } from './filters';

export const SimpleAssortment = [
  {
    _id: 'simple-assortment',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['unique-slug', 'slug-de', 'slug-fr'],
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
  },
  {
    _id: 'simple-assortment2',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: false,
    isRoot: true,
    isBase: false,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment3',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment4',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment5',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: true,
    isRoot: false,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment6',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment7',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: false,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment8',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment9',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
  {
    _id: 'simple-assortment10',
    created: new Date('2019-07-30T09:23:26.253+0000'),
    type: 'SIMPLE_PRODUCT',
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: 'admin',
    slugs: ['old-slug-de', 'slug-de', 'slug-fr'],
    updated: new Date('2019-09-10T14:29:37.015+0000'),
    published: new Date('2019-07-30T09:23:57.329+0000'),
  },
];

export const GermanAssortmentText = {
  _id: 'german',
  locale: 'de',
  assortmentId: 'simple-assortment',
  slug: 'slug-de',
  title: 'simple assortment de',
  updated: new Date('2019-09-10T14:28:46.103+0000'),
  brand: 'brand-de',
  description: 'text-de',
  labels: ['label-de-1', 'label-de-2'],
  subtitle: 'subsimple assortment de',
  vendor: 'vendor-de',
};

export const FrenchAssortmentText = {
  _id: 'french',
  locale: 'fr',
  assortmentId: 'simple-assortment',
  labels: ['label-fr-1'],
  slug: 'slug-fr',
  title: 'title-fr',
  updated: new Date('2019-09-10T14:28:46.105+0000'),
  brand: 'brand-fr-1',
  description: 'text-fr-1',
  subtitle: 'subtitle-fr',
  vendor: 'vendor-fr-1',
};

export const AssortmentProduct = {
  _id: 'assortment-product-1',
  assortmentId: 'simple-assortment',
  productId: SimpleProduct._id,
  labels: ['label-fr-1'],
  sortKey: 1,
  tags: ['assortment-et-1'],
};

export const AssortmentLinks = [
  {
    _id: 'assortment-link-1',
    sortKey: 1,
    tags: ['assortment-link-test'],
    meta: null,
    parentAssortmentId: SimpleAssortment[0]._id,
    childAssortmentId: SimpleAssortment[1]._id,
  },
  {
    _id: 'assortment-link-2',
    sortKey: 1,
    tags: ['assortment-link-test'],
    meta: null,
    parentAssortmentId: SimpleAssortment[2]._id,
    childAssortmentId: SimpleAssortment[3]._id,
  },
];

export const AssortmentFilters = [
  {
    _id: 'assortment-filter-1',
    sortKey: 1,
    tags: ['assortment-filter-1'],
    assortment: SimpleAssortment[1],
    filter: MultiChoiceFilter,
  },
];

export const PngMedia = {
  _id: 'assortment-png-media',
  name: 'Screenshot from 2021-04-19 20-09-19.png',
  extension: 'png',
  ext: 'png',
  extensionWithDot: '.png',
  path: 'assets/app/uploads/assortment_document/ZcBB9ADJMmvJXbZWa.png',
  meta: {},
  type: 'image/png',
  mime: 'image/png',
  'mime-type': 'image/png',
  size: 544892,
  userId: 'admin',
  versions: {
    original: {
      path: 'assets/app/uploads/assortment_document/ZcBB9ADJMmvJXbZWa.png',
      size: 544892,
      type: 'image/png',
      extension: 'png',
    },
  },
  _downloadRoute: '/cdn/storage',
  _collectionName: 'assortment_document',
  isVideo: false,
  isAudio: false,
  isImage: true,
  isText: false,
  isJSON: false,
  isPDF: false,
  _storagePath: 'assets/app/uploads/assortment_document',
};

export const PngAssortmentMedia = {
  _id: 'assortment-png',
  mediaId: 'assortment-png-media',
  tags: [],
  sortKey: 1,
  assortmentId: 'simple-assortment',
  created: new Date('2019-09-10T14:29:01.093+0000'),
};

export const GermanPngAssortmentMediaText = {
  _id: 'german-png-assortment',
  locale: 'de',
  assortmentMediaId: 'assortment-png',
  subtitle: 'assortment-media-subtitle-de',
  title: 'assortment-media-title-de',
  updated: new Date('2019-09-10T14:42:16.175+0000'),
};

export const FrenchPngAssortmentMediaText = {
  _id: 'french-png-assortment',
  locale: 'fr',
  assortmentMediaId: 'assortment-png',
  subtitle: 'assortment-media-subtitle-fr',
  title: 'assortment-media-title-fr',
  updated: new Date('2019-09-10T14:42:16.177+0000'),
};

export default async function seedAssortments(db) {
  await db.collection('assortments').insertMany(SimpleAssortment);
  await db.collection('assortment_texts').findOrInsertOne(GermanAssortmentText);
  await db.collection('assortment_texts').findOrInsertOne(FrenchAssortmentText);
  await db.collection('assortment_links').insertMany(AssortmentLinks);
  await db.collection('assortment_products').findOrInsertOne(AssortmentProduct);
  await db.collection('assortment_filters').insertMany(AssortmentFilters);
  await db.collection('assortment_media').findOrInsertOne(PngAssortmentMedia);
  await db
    .collection('assortment_media_texts')
    .findOrInsertOne(GermanPngAssortmentMediaText);
  await db
    .collection('assortment_media_texts')
    .findOrInsertOne(FrenchPngAssortmentMediaText);

  await db.collection('assortment_document').findOrInsertOne(PngMedia);
}
