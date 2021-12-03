import { BookmarksModule } from './bookmarks';
import { CountriesModule } from './countries';
import { CurrenciesModule } from './currencies';
import { EventsModule } from './events';
import { FilesModule } from './files';
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
  files: FilesModule;
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
