import { EventsModule } from './events';
import { BookmarksModule } from './bookmarks';
import { CurrenciesModule } from './currencies';
import { CountriesModule } from './countries';
import { LanguagesModule } from './languages';
import { PaymentModule } from './payments';

export interface Modules {
  accounts: any;
  assortments: any;
  bookmarks: BookmarksModule;
  countries: CountriesModule;
  currencies: CurrenciesModule;
  delivery: any;
  documents: any;
  enrollments: any;
  events: EventsModule;
  filters: any;
  languages: LanguagesModule;
  messaging: any;
  orders: any;
  payment: PaymentModule;
  products: any;
  quotations: any;
  users: any;
  warehousing: any;
  worker: any;
}
