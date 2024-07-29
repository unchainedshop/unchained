import { OrdersModule, OrdersSettingsOptions } from './orders.js';
import { QuotationsModule, QuotationsSettingsOptions } from './quotations.js';
import { UsersModule, UserSettingsOptions } from './user.js';

import type { AssortmentsModule, AssortmentsSettingsOptions } from '@unchainedshop/core-assortments';
import type { BookmarksModule } from '@unchainedshop/core-bookmarks';
import type { CountriesModule } from '@unchainedshop/core-countries';
import type { CurrenciesModule } from '@unchainedshop/core-currencies';
import type { DeliveryModule, DeliverySettingsOptions } from '@unchainedshop/core-delivery';
import type { EnrollmentsModule, EnrollmentsSettingsOptions } from '@unchainedshop/core-enrollments';
import type { EventsModule } from '@unchainedshop/core-events';
import type { FilesModule, FilesSettingsOptions } from '@unchainedshop/core-files';
import type { FiltersModule, FiltersSettingsOptions } from '@unchainedshop/core-filters';
import type { LanguagesModule } from '@unchainedshop/core-languages';
import type { MessagingModule } from '@unchainedshop/core-messaging';

import type { PaymentModule, PaymentSettingsOptions } from '@unchainedshop/core-payment';
import type { ProductsModule, ProductsSettingsOptions } from '@unchainedshop/core-products';

import type { WarehousingModule } from '@unchainedshop/core-warehousing';
import type { WorkerModule, WorkerSettingsOptions } from '@unchainedshop/core-worker';
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
