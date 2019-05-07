import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Meteor } from 'meteor/meteor';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { ProductMediaTexts, ProductMedia, Media } from './collections';

Factory.createMedia = () =>
  Meteor.wrapAsync(Media.load, Media)(faker.image.avatar(), {
    fileName: faker.system.fileName()
  });

Factory.define('productMedia', ProductMedia, {
  mediaId: () => Factory.createMedia()._id,
  productId: () => Factory.get('simpleProduct'),
  authorId: () => Factory.get('user'),
  tags: () =>
    faker.random.boolean()
      ? [faker.random.arrayElement(['red', 'green', 'blue'])]
      : [],
  ...fakeTimestampFields
});

Factory.define('productMediaText', ProductMediaTexts, {
  productMediaId: () => Factory.get('productMedia'),
  locale: () => faker.random.arrayElement(['de', 'en']),
  authorId: () => Factory.get('user'),
  title: () => faker.lorem.words(),
  subtitle: () => faker.lorem.sentence(),
  ...fakeTimestampFields
});
