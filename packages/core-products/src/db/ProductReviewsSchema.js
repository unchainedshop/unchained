import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const ProductReviewVoteTypes = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
};

export const ProductReviewsSchema = new SimpleSchema(
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
);
