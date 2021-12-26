import { Context } from '@unchainedshop/types/api';
import { Bookmark } from '@unchainedshop/types/bookmarks';

export default {
  product: async (obj: Bookmark, _, { modules }: Context) => {
    return await modules.products.findProduct({ productId: obj.productId });
  },
  user: async (obj: Bookmark, _: never, { modules }: Context) => {
    return await modules.users.findUser({ userId: obj.userId });
  },
};
