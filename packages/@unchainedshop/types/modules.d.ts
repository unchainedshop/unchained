import { EventsModule } from './events';
import { BookmarksModule } from './bookmarks';
import { CurrenciesModule } from './currencies';
import { LogsModule } from './logs';

export declare interface Modules {
  accounts: any;
  assortments: any;
  bookmarks: BookmarksModule;
  countries: any;
  currencies: CurrenciesModule;
  delivery: any;
  documents: any;
  enrollments: any;
  events: EventsModule;
  filters: any;
  languages: any;
  logs: LogsModule;
  messaging: any;
  orders: any;
  payment: any;
  products: any;
  quotations: any;
  users: any;
  warehousing: any;
  worker: any;
}
