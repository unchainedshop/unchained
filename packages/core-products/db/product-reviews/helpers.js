import 'meteor/dburles:collection-helpers';
import { Users } from 'meteor/unchained:core-users';
import { ProductReviews } from './collections';
import { Products } from '../products/collections';

ProductReviews.helpers({
  product() {
    return Products.findOne({ _id: this.productId });
  },
  author() {
    return Users.findOne({ _id: this.authorId });
  },
});

ProductReviews.createReview = function createReview({
  productId,
  authorId,
  ...product
} = {}) {
  const _id = this.insert({
    created: new Date(),
    productId,
    authorId,
    ...product,
  });
  return this.findOne({ _id });
};

ProductReviews.updateReview = function updateReview({
  _id,
  ...review
}) {
  this.update({ _id, deleted: null }, {
    $set: {
      ...review,
      updated: new Date(),
    },
  });
  return this.findOne({ _id, deleted: null });
};

ProductReviews.deleteReview = function deleteReview({ _id }) {
  this.update({ _id, deleted: null }, {
    $set: {
      deleted: new Date(),
    },
  });
  return this.findOne({ _id });
};

ProductReviews.findReviewById = function findReviewById(_id, ...options) {
  return this.findOne({ _id }, ...options);
};

ProductReviews.findReviews = function findReviews({ productId, authorId } = {}, ...options) {
  return this
    .find({
      ...(productId ? { productId } : {}),
      ...(authorId ? { authorId } : {}),
      deleted: null,
    }, ...options)
    .fetch();
};
