import { AccountsModule, AccountsSettingsOptions } from './accounts';
import { AssortmentsModule, AssortmentsSettingsOptions } from './assortments';
import { BookmarksModule } from './bookmarks';
import { CountriesModule } from './countries';
import { CurrenciesModule } from './currencies';
import { DeliveryModule, DeliverySettingsOptions } from './delivery';
import { EnrollmentsModule, EnrollmentsSettingsOptions } from './enrollments';
import { EventsModule } from './events';
import { FilesModule, FilesSettingsOptions } from './files';
import { FiltersModule, FiltersSettingsOptions } from './filters';
import { LanguagesModule } from './languages';
import { MessagingModule } from './messaging';
import { OrdersModule, OrdersSettingsOptions } from './orders';
import { PaymentModule, PaymentSettingsOptions } from './payments';
import { ProductsModule, ProductsSettingsOptions } from './products';
import { QuotationsModule, QuotationsSettingsOptions } from './quotations';
import { UsersModule } from './user';
import { WarehousingModule } from './warehousing';
import { WorkerModule } from './worker';

export interface Modules {
  accounts: AccountsModule;
  assortments: AssortmentsModule;
  bookmarks: BookmarksModule;
  countries: CountriesModule;
  currencies: CurrenciesModule;
  delivery: DeliveryModule;
  enrollments: EnrollmentsModule;
  events: EventsModule;
  files: FilesModule;
  filters: FiltersModule;
  languages: LanguagesModule;
  messaging: MessagingModule;
  orders: OrdersModule;
  payment: PaymentModule;
  products: ProductsModule;
  quotations: QuotationsModule;
  users: UsersModule;
  warehousing: WarehousingModule;
  worker: WorkerModule;
}

export interface ModuleOptions {
  accounts?: AccountsSettingsOptions;
  assortments?: AssortmentsSettingsOptions;
  products?: ProductsSettingsOptions;
  delivery?: DeliverySettingsOptions;
  filters?: FiltersSettingsOptions;
  enrollments?: EnrollmentsSettingsOptions;
  orders?: OrdersSettingsOptions;
  quotations?: QuotationsSettingsOptions;
  files?: FilesSettingsOptions;
  payment?: PaymentSettingsOptions;
}
