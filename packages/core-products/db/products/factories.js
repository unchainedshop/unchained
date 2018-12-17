import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { ProductTypes, ProductStatus } from './schema';
import { Products, ProductTexts } from './collections';

Factory.define('simpleProduct', Products, {
  status: () => faker.random.arrayElement([ProductStatus.ACTIVE, ProductStatus.DRAFT]),
  type: () => ProductTypes.SimpleProduct,
  sequence: () => faker.random.number(),
  authorId: () => Factory.get('user'),
  published: () => (faker.random.boolean() ? faker.date.past() : null),
  slugs: [() => faker.lorem.slug()],
  tags: () => (faker.random.boolean() ? [faker.random.arrayElement(['business', 'private', 'specials'])] : []),
  commerce: () => ({
    pricing: [{
      currencyCode: 'CHF',
      countryCode: 'CH',
      amount: faker.finance.amount(50, 3000, 0),
      isTaxable: faker.random.boolean(),
      isNetPrice: faker.random.boolean(),
    }],
  }),
  warehousing: () => ({
    sku: faker.hacker.abbreviation(),
    baseUnit: 'ST',
  }),
  supply: () => ({
    weightInGram: faker.random.number(),
    heightInMillimeters: faker.random.number(),
    lengthInMillimeters: faker.random.number(),
    widthInMillimeters: faker.random.number(),
  }),
  ...fakeTimestampFields,
});

Factory.define('configurableProduct', Products, {
  status: () => faker.random.arrayElement(Object.values(ProductStatus)),
  type: () => ProductTypes.ConfigurableProduct,
  sequence: () => faker.random.number(),
  slugs: [() => faker.lorem.slug()],
  authorId: () => Factory.get('user'),
  published: () => (faker.random.boolean() ? faker.date.past() : null),
  tags: () => (faker.random.boolean() ? [faker.random.arrayElement(['business', 'private', 'specials'])] : []),
  ...fakeTimestampFields,
});

Factory.define('productText', ProductTexts, {
  productId: () => Factory.get('simpleProduct'),
  locale: () => faker.random.arrayElement(['de', 'en']),
  title: () => faker.commerce.productName(),
  vendor: () => faker.company.companyName(),
  subtitle: () => faker.lorem.sentence(),
  slug: () => faker.lorem.slug(),
  description: () => faker.lorem.text(),
  labels: () => (faker.random.boolean() ? [faker.random.arrayElement(['Neu', 'Knapp', 'Verstaubt'])] : []),
  ...fakeTimestampFields,
});
