import { CurrenciesModule } from './currencies.js';
import { DeliveryModule, DeliverySettingsOptions } from './delivery.js';
import { EnrollmentsModule, EnrollmentsSettingsOptions } from './enrollments.js';
import { FilesModule, FilesSettingsOptions } from './files.js';
import { FiltersModule, FiltersSettingsOptions } from './filters.js';
import { LanguagesModule } from './languages.js';
import { OrdersModule, OrdersSettingsOptions } from './orders.js';
import { PaymentModule, PaymentSettingsOptions } from './payments.js';
import { QuotationsModule, QuotationsSettingsOptions } from './quotations.js';
import { UsersModule, UserSettingsOptions } from './user.js';
import { WarehousingModule } from './warehousing.js';

import type { AssortmentsModule, AssortmentsSettingsOptions } from '@unchainedshop/core-assortments';
import type { BookmarksModule } from '@unchainedshop/core-bookmarks';
import type { CountriesModule } from '@unchainedshop/core-countries';

import type { EventsModule } from '@unchainedshop/core-events';
import type { ProductsModule, ProductsSettingsOptions } from '@unchainedshop/core-products';
import type { WorkerModule, WorkerSettingsOptions } from '@unchainedshop/core-worker';
import type { MessagingModule } from '@unchainedshop/core-messaging';
export interface Modules {
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
  assortments?: AssortmentsSettingsOptions;
  products?: ProductsSettingsOptions;
  delivery?: DeliverySettingsOptions;
  filters?: FiltersSettingsOptions;
  enrollments?: EnrollmentsSettingsOptions;
  orders?: OrdersSettingsOptions;
  quotations?: QuotationsSettingsOptions;
  files?: FilesSettingsOptions;
  payment?: PaymentSettingsOptions;
  worker?: WorkerSettingsOptions;
  users?: UserSettingsOptions;
}
