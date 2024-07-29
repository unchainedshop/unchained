import type { ProductServices } from '@unchainedshop/core-products';
import type { BookmarkServices } from '@unchainedshop/core-bookmarks';
import type { FileServices } from '@unchainedshop/core-files';
import type { UserServices } from '@unchainedshop/core-users';
import type { OrderServices } from '@unchainedshop/core-orders';

export interface Services {
  bookmarks: BookmarkServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
}
