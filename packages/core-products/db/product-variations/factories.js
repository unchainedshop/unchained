import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { ProductVariationType } from './schema';
import { ProductVariations, ProductVariationTexts } from './collections';

Factory.define('productVariation', ProductVariations, {
  productId: () => Factory.get('configurableProduct'),
  key: () => faker.lorem.slug(),
  authorId: () => Factory.get('user'),
  type: () => faker.random.arrayElement(Object.values(ProductVariationType)),
  options: () => ['red', 'green', 'blue'],
  ...fakeTimestampFields
});

Factory.define('productVariationText', ProductVariationTexts, {
  productVariationId: () => Factory.get('productMedia'),
  productVariationOptionValue: () => null,
  locale: () => faker.random.arrayElement(['de', 'en']),
  authorId: () => Factory.get('user'),
  title: () => faker.lorem.words(),
  subtitle: () => faker.lorem.sentence(),
  ...fakeTimestampFields
});
