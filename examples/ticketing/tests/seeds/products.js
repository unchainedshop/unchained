export const TokenizedProduct = {
  _id: 'tokenized-product',
  created: new Date('2019-07-30T09:23:26.253+0000'),
  type: 'SIMPLE_PRODUCT',
  status: 'ACTIVE',
  sequence: 13396,
  slugs: ['tokenized-new'],
  tags: ['tokenized'],
  updated: new Date('2025-12-23T10:04:06.891Z'),
  tokenization: {
    contractAddress: '0x8562f9a393e9d948bb7572940af717375503dd46',
    contractStandard: 'ERC1155',
    tokenId: '',
    supply: 100,
  },
  published: new Date('2025-12-23T10:02:58.145Z'),
  commerce: {
    pricing: [
      {
        amount: 80000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
};

export const GermanProductText = {
  _id: 'german',
  locale: 'de',
  productId: TokenizedProduct._id,
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
  productId: TokenizedProduct._id,
  labels: ['label-fr-1'],
  slug: 'slug-fr',
  title: 'simple product title fr',
  updated: new Date('2019-09-10T14:28:46.105+0000'),
  brand: 'brand-fr-1',
  description: 'text-fr-1',
  subtitle: 'subtitle-fr',
  vendor: 'vendor-fr-1',
};

export default async function seedProducts(db) {
  await db.collection('products').insertMany([TokenizedProduct]);

  await db.collection('product_texts').findOrInsertOne(GermanProductText);
  await db.collection('product_texts').findOrInsertOne(FrenchProductText);
}
