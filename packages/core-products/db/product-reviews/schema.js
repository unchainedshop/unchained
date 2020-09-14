import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';

import { ProductReviews } from './collections';

export const ProductReviewVoteTypes = { // eslint-disable-line
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
};

ProductReviews.attachSchema(
  new SimpleSchema(
    {
      productId: { type: String, required: true },
      authorId: { type: String, required: true },
      rating: {
        type: SimpleSchema.Integer,
        min: 1,
        max: 100,
      },
      title: String,
      review: String,
      meta: { type: Object, blackbox: true },
      votes: Array,
      'votes.$': { type: Object, required: true },
      'votes.$.timestamp': { type: Date, required: true },
      'votes.$.userId': { type: String, required: true },
      'votes.$.type': {
        type: String,
        required: true,
        allowedValues: Object.values(ProductReviewVoteTypes),
      },
      'votes.$.meta': { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200915.5,
  name: 'drop ProductReviews related indexes',
  up() {
    ProductReviews.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  ProductReviews.rawCollection().createIndex({ productId: 1 });
  ProductReviews.rawCollection().createIndex({ authorId: 1 });
};
