import type { ProductServices } from '@unchainedshop/core-products';
import type { BookmarkServices } from '@unchainedshop/core-bookmarks';
import { FileServices } from './files.js';
import { OrderServices } from './orders.js';
import { UserServices } from './user.js';

export interface Services {
  bookmarks: BookmarkServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
}
