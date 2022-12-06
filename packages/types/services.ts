import { BookmarkServices } from './bookmarks';
import { CountryServices } from './countries';
import { FileServices } from './files';
import { OrderServices } from './orders';
import { ProductServices } from './products';
import { UserServices } from './user';

export interface Services {
  bookmarks: BookmarkServices;
  countries: CountryServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
}
