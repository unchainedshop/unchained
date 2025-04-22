import { Bookmark as BookmarkType } from '@unchainedshop/core-bookmarks';
import { Product } from '@unchainedshop/core-products';
import { User } from '@unchainedshop/core-users';

import { Context } from '../../context.js';

export type HelperType<T> = (bookmark: BookmarkType, _: never, context: Context) => T;

export interface BookmarkHelperTypes {
  product: HelperType<Promise<Product>>;
  user: HelperType<Promise<User>>;
}

export const Bookmark: BookmarkHelperTypes = {
  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
    });
    return product;
  },

  user: async (obj, _, { loaders }) => {
    return loaders.userLoader.load({ userId: obj.userId });
  },
};
