import { Context } from '@unchainedshop/types/api';
import { Bookmark as BookmarkType } from '@unchainedshop/types/bookmarks';
import { Product } from '@unchainedshop/types/products';
import { User } from '@unchainedshop/types/user';

export type HelperType<T> = (bookmark: BookmarkType, _: never, context: Context) => T;

export interface BookmarkHelperTypes {
  product: HelperType<Promise<Product>>;
  user: HelperType<Promise<User>>;
}

export const Bookmark: BookmarkHelperTypes = {
  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
      includeDrafts: true,
    });
    return product;
  },

  user: async (obj, _, { modules }) => {
    return modules.users.findUserById(obj.userId);
  },
};
