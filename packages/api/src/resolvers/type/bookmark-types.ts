import { Context } from '@unchainedshop/api';
import { Bookmark as BookmarkType } from '@unchainedshop/types/bookmarks.js';
import { Product } from '@unchainedshop/types/products.js';
import { User } from '@unchainedshop/types/user.js';

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
