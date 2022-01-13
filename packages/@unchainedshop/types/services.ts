import { BookmarkServices } from './bookmarks';
import { CountryServices } from './countries';
import { FileServices } from './files';
import { OrderServices } from './orders';
import { PaymentServices } from './payments';
import { ProductServices } from './products';
import { UserServices } from './user';

export interface Services {
  bookmarks: BookmarkServices;
  countries: CountryServices;
  files: FileServices;
  orders: OrderServices;
  payment: PaymentServices;
  products: ProductServices;
  users: UserServices;
}
