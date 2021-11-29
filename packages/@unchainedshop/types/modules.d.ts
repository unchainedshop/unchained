import { EventsModule } from '@unchainedshop/types/events';
import { BookmarksModule } from '@unchainedshop/types/bookmarks';
import { CurrenciesModule } from '@unchainedshop/types/currencies';
import { CountriesModule } from '@unchainedshop/types/countries';

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
  languages: any;
  messaging: any;
  orders: any;
  payment: any;
  products: any;
  quotations: any;
  users: any;
  warehousing: any;
  worker: any;
}
