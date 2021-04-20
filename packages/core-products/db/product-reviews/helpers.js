import 'meteor/dburles:collection-helpers';
import { Users } from 'meteor/unchained:core-users';
import { ProductReviews } from './collections';
import { ProductReviewVoteTypes } from './schema';
import { Products } from '../products/collections';

const buildFindSelector = ({ productId, authorId, deleted = null } = {}) => {
  return {
    ...(productId ? { productId } : {}),
    ...(authorId ? { authorId } : {}),
    deleted,
  };
};

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
  voteCount({ type = ProductReviewVoteTypes.UPVOTE }) {
    return this.userIdsThatVoted({ type }).length;
  },
  ownVotes(props, { userId: ownUserId }) {
    return (this.votes || []).filter(({ userId }) => userId === ownUserId);
  },
  addVote({ userId, type = ProductReviewVoteTypes.UPVOTE, meta } = {}) {
    if (!this.userIdsThatVoted({ type }).includes(userId)) {
      if (type === ProductReviewVoteTypes.UPVOTE) {
        // if this is an upvote, remove the downvote first
        ProductReviews.removeVote({
          productReviewId: this._id,
          userId,
          type: ProductReviewVoteTypes.DOWNVOTE,
        });
      }
      if (type === ProductReviewVoteTypes.DOWNVOTE) {
        // if this is a downvote, remove the upvote first
        ProductReviews.removeVote({
          productReviewId: this._id,
          userId,
          type: ProductReviewVoteTypes.UPVOTE,
        });
      }
      return ProductReviews.addVote({
        productReviewId: this._id,
        userId,
        type,
        meta,
      });
    }
    return this;
  },
  removeVote({ userId, type = ProductReviewVoteTypes.UPVOTE } = {}) {
    return ProductReviews.removeVote({
      productReviewId: this._id,
      userId,
      type,
    });
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
  productReviewId,
  ...review
}) {
  this.update(
    { _id: productReviewId, deleted: null },
    {
      $set: {
        ...review,
        updated: new Date(),
      },
    }
  );
  return this.findOne({ _id: productReviewId, deleted: null });
};

ProductReviews.addVote = function addVote({ productReviewId, type, ...vote }) {
  this.update(
    { _id: productReviewId, deleted: null },
    {
      $push: {
        votes: {
          timestamp: new Date(),
          type,
          ...vote,
        },
      },
    }
  );
  return this.findOne({ _id: productReviewId, deleted: null });
};

ProductReviews.removeVote = function addVote({
  productReviewId,
  userId,
  type,
}) {
  this.update(
    { _id: productReviewId, deleted: null },
    {
      $pull: {
        votes: { userId, type },
      },
    }
  );
  return this.findOne({ _id: productReviewId, deleted: null });
};

ProductReviews.deleteReview = function deleteReview({ productReviewId }) {
  this.update(
    { _id: productReviewId, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  return this.findOne({ _id: productReviewId });
};

ProductReviews.reviewExists = ({ productReviewId }) => {
  return !!ProductReviews.find({ _id: productReviewId }, { limit: 1 }).count();
};

ProductReviews.findReview = function findReview(
  { productReviewId },
  ...options
) {
  return ProductReviews.findOne({ _id: productReviewId }, ...options);
};

ProductReviews.findReviews = function findReviews(query, ...options) {
  return this.find(buildFindSelector(query), ...options).fetch();
};

ProductReviews.count = async (query) => {
  const count = await ProductReviews.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};
