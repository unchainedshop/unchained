import { EventsModule } from ".";
import { BookmarksModule } from "./bookmarks";
import { LogsModule } from "./logs";

export declare interface Modules {
  accounts: any;
  assortments: any;
  bookmarks: BookmarksModule;
  countries: any;
  currencies: any;
  delivery: any;
  documents: any;
  enrollments: any;
  events: EventsModule;
  filters: any;
  languages: any;
  logger: LogsModule;
  messaging: any;
  orders: any;
  payment: any;
  products: any;
  quotations: any;
  users: any;
  warehousing: any;
  worker: any;
}
