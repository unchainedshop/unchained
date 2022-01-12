import { BookmarkServices } from './bookmarks';
import { CountryServices } from './countries';
import { OrderServices } from './orders';
import { PaymentServices } from './payments';
import { ProductServices } from './products';
import { UserServices } from './user';

export interface Services {
  bookmarks: BookmarkServices;
  countries: CountryServices;
  orders: OrderServices;
  payment: PaymentServices;
  products: ProductServices;
  users: UserServices;
}
