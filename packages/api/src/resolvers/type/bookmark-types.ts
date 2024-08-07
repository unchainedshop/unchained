import type { Bookmark as BookmarkType } from '@unchainedshop/core-bookmarks';
import type { Product } from '@unchainedshop/core-products';
import type { User } from '@unchainedshop/core-users';

import { Context } from '@unchainedshop/api';

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

  user: async (obj, _, { modules }) => {
    return modules.users.findUserById(obj.userId);
  },
};
