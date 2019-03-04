import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { ProductReviews } from './collections';

Factory.define('productReview', ProductReviews, {
  productId: () => Factory.get('simpleProduct'),
  authorId: () => Factory.get('user'),
  rating: faker.finance.amount(1, 100, 0),
  ...fakeTimestampFields
});
