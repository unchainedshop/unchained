import 'meteor/dburles:collection-helpers';
import { Users } from 'meteor/unchained:core-users';
import { emit } from 'meteor/unchained:events';
import { ProductReviews } from './collections';
import { ProductReviewVoteTypes } from './schema';
import { Products } from '../products/collections';

const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
};
const buildFindSelector = ({
  productId,
  authorId,
  deleted = null,
  queryString,
} = {}) => {
  const selector = {
    ...(productId ? { productId } : {}),
    ...(authorId ? { authorId } : {}),
    deleted,
  };

  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

const buildSortOptions = (options) => {
  const sortBy = {};
  options?.forEach(({ key, value }) => {
    sortBy[key] = SORT_DIRECTIONS[value];
  });
  return sortBy;
};

ProductReviews.helpers({
  // Use product and user find from modules directly
  /* product() {
    return Products.findOne({ _id: this.productId });
  },
  author() {
    return Users.findOne({ _id: this.authorId });
  }, */

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
      const productReview = ProductReviews.addVote({
        productReviewId: this._id,
        userId,
        type,
        meta,
      });
      emit('PRODUCT_REVIEW_ADD_VOTE', { productReview });
      return productReview;
    }
    return this;
  },
  removeVote({ userId, type = ProductReviewVoteTypes.UPVOTE } = {}) {
    const removedVote = ProductReviews.removeVote({
      productReviewId: this._id,
      userId,
      type,
    });
    emit('PRODUCT_REMOVE_REVIEW_VOTE', {
      productReviewId: this._id,
      userId,
      type,
    });
    return removedVote;
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
  const productReview = this.findOne({ _id });
  emit('PRODUCT_REVIEW_CREATE', { productReview });
  return productReview;
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
  const productReview = this.findOne({ _id: productReviewId, deleted: null });
  emit('PRODUCT_UPDATE_REVIEW', { productReview });
  return productReview;
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
  emit('PRODUCT_REMOVE_REVIEW', { productReviewId });
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

ProductReviews.count = async (query) => {
  const count = await ProductReviews.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

ProductReviews.findReviews = async (
  { queryString, ...rest },
  { limit, offset, sort: sortOptions = [{ key: 'rating', value: 'DESC' }] }
) => {
  const selector = buildFindSelector({ queryString, ...rest });
  if (queryString) {
    const reviewsArray = await ProductReviews.rawCollection()
      .find(selector, {
        skip: offset,
        limit,
        projection: { score: { $meta: 'textScore' } },
        sort: {
          score: { $meta: 'textScore' },
          ...buildSortOptions(sortOptions),
        },
      })
      .toArray();
    return (reviewsArray || []).map((item) => new ProductReviews._transform(item)); // eslint-disable-line
  }

  return ProductReviews.find(selector, {
    skip: offset,
    limit,
    sort: buildSortOptions(sortOptions),
  }).fetch();
};
