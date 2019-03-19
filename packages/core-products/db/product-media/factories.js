import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Meteor } from 'meteor/meteor';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { ProductMediaTexts, ProductMedia, Media } from './collections';

Factory.createMedia = () =>
  Meteor.wrapAsync(Media.load, Media)(faker.image.avatar(), {
    fileName: faker.system.fileName()
  });

Factory.define('productMediaText', ProductMediaTexts, {
  productMediaId: () => Factory.get('productMedia'),
  locale: () => faker.random.arrayElement(['de', 'en']),
  title: () => faker.lorem.words(),
  subtitle: () => faker.lorem.sentence(),
  ...fakeTimestampFields
});

Factory.define('productMedia', ProductMedia, {
  mediaId: () => Factory.createMedia()._id,
  tags: () =>
    faker.random.boolean()
      ? [faker.random.arrayElement(['red', 'green', 'blue'])]
      : [],
  productId: () => Factory.get('simpleProduct'),
  ...fakeTimestampFields
});
