import 'meteor/dburles:collection-helpers';
import { Users } from 'meteor/unchained:core-users';
import { ProductReviews } from './collections';
import { ProductReviewVoteTypes } from './schema';
import { Products } from '../products/collections';

ProductReviews.helpers({
  product() {
    return Products.findOne({ _id: this.productId });
  },
  author() {
    return Users.findOne({ _id: this.authorId });
  },
  userIdsThatVoted({ type = ProductReviewVoteTypes.UPVOTE } = {}) {
    return (this.votes || [])
      .filter(({ type: currentType }) => type === currentType)
      .map(({ userId }) => userId);
  },
  upvoteCount() {
    return this.userIdsThatVoted({ type: ProductReviewVoteTypes.UPVOTE }).length;
  },
  downVoteCount() {
    return this.userIdsThatVoted({ type: ProductReviewVoteTypes.DOWNVOTE }).length;
  },
  addVote({ userId, type = ProductReviewVoteTypes.UPVOTE } = {}) {
    if (!this.userIdsThatVoted({ type }).includes(userId)) {
      if (type === ProductReviewVoteTypes.UPVOTE) {
        // if this is an upvote, remove the downvote first
        ProductReviews.removeVote({ _id: this._id, userId, type: ProductReviewVoteTypes.DOWNVOTE });
      }
      if (type === ProductReviewVoteTypes.DOWNVOTE) {
        // if this is a downvote, remove the upvote first
        ProductReviews.removeVote({ _id: this._id, userId, type: ProductReviewVoteTypes.UPVOTE });
      }
      ProductReviews.addVote({ _id: this._id, userId, type });
    }
  },
  removeVote({ userId, type = ProductReviewVoteTypes.UPVOTE } = {}) {
    ProductReviews.removeVote({ _id: this._id, userId, type });
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

ProductReviews.addVote = function addVote({
  _id,
  userId,
  type,
}) {
  this.update({ _id, deleted: null }, {
    $push: {
      votes: { timestamp: new Date(), userId, type },
    },
  });
  return this.findOne({ _id, deleted: null });
};

ProductReviews.removeVote = function addVote({
  _id,
  userId,
  type,
}) {
  this.update({ _id, deleted: null }, {
    $pull: {
      votes: { userId, type },
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
