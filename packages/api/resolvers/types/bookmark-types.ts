import { Context } from '@unchainedshop/types/api';
import { Bookmark as BookmarkType } from '@unchainedshop/types/bookmarks';
import { Product } from '@unchainedshop/types/products';
import { User } from '@unchainedshop/types/user';

type HelperType<T> = (bookmark: BookmarkType, _: never, context: Context) => T;

interface BookmarkHelperTypes {
  product: HelperType<Promise<Product>>;
  user: HelperType<Promise<User>>;
}

export const Bookmark: BookmarkHelperTypes = {
  product: async (obj, _, { modules }) => {
    return modules.products.findProduct({ productId: obj.productId });
  },
  user: async (obj, _, { modules }) => {
    return modules.users.findUser({ userId: obj.userId });
  },
};
