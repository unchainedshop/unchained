import { Context } from '../../../context.js';
import { Product } from '@unchainedshop/core-products';
import {
  ProductReview as ProductReviewType,
  ProductReviewVoteType,
  ProductVote,
} from '@unchainedshop/core-products';
import { User } from '@unchainedshop/core-users';

type HelperType<P, T> = (product: ProductReviewType, params: P, context: Context) => T;

export interface ProductReviewHelperTypes {
  author: HelperType<never, Promise<User>>;
  product: HelperType<never, Promise<Product>>;
  voteCount: HelperType<{ type: ProductReviewVoteType }, number>;
  ownVotes: HelperType<never, Promise<ProductVote[]>>;
}
export const ProductReview: ProductReviewHelperTypes = {
  author: async (obj, _, { loaders }) => {
    return loaders.userLoader.load({ userId: obj.authorId });
  },

  product: async (review, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: review.productId,
    });
    return product;
  },

  ownVotes: async (obj, _, { modules, userId }) => {
    return modules.products.reviews.votes.ownVotes(obj, { userId });
  },

  voteCount: (obj, { type }, { modules }) => {
    return modules.products.reviews.votes.userIdsThatVoted(obj, { type }).length;
  },
};
