import { BookmarkServices } from './bookmarks.js';
import { CountryServices } from './countries.js';
import { EnrollmentServices } from './enrollments.js';
import { FileServices } from './files.js';
import { OrderServices } from './orders.js';
import { ProductServices } from './products.js';
import { QuotationServices } from './quotations.js';
import { UserServices } from './user.js';

export interface Services {
  bookmarks: BookmarkServices;
  countries: CountryServices;
  files: FileServices;
  orders: OrderServices;
  products: ProductServices;
  users: UserServices;
  quotations: QuotationServices;
  enrollments: EnrollmentServices;
}
