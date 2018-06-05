import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import * as Collections from './collections';


Factory.define('assortment', Collections.Assortments, {
  isActive: () => faker.random.boolean(),
  isBase: () => false,
  sequence: () => faker.random.number(),
  slugs: [() => faker.lorem.slug()],
  ...fakeTimestampFields,
});

Factory.define('assortmentText', Collections.AssortmentTexts, {
  assortmentId: () => Factory.get('assortment'),
  locale: () => faker.random.arrayElement(['de', 'en']),
  title: () => faker.commerce.productName(),
  slug: () => faker.lorem.slug(),
  ...fakeTimestampFields,
});

Factory.define('assortmentProduct', Collections.AssortmentProducts, {
  assortmentId: () => Factory.get('assortment'),
  productId: () => Factory.get('simpleProduct'),
  sortKey: () => faker.random.number(),
  ...fakeTimestampFields,
});

Factory.define('assortmentLink', Collections.AssortmentLinks, {
  parentAssortmentId: () => Factory.get('assortment'),
  childAssortmentId: () => Factory.get('assortment'),
  sortKey: () => faker.random.number(),
  ...fakeTimestampFields,
});
