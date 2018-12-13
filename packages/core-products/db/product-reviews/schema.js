import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { ProductReviews } from './collections';

ProductReviews.attachSchema(new SimpleSchema({
  productId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  rating: {
    type: SimpleSchema.Integer, min: 1, max: 100,
  },
  title: String,
  review: String,
  meta: { type: Object, blackbox: true },
  upvoters: [SimpleSchema.RegEx.Id],
  downvoters: [SimpleSchema.RegEx.Id],
  ...Schemas.timestampFields,
}, { requiredByDefault: false }));
