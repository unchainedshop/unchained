import { Db, Locale, MigrationRepository } from './common';
import { AccountsSettingsOptions } from './accounts';
import { AssortmentsSettingsOptions } from './assortments';
import { DeliverySettingsOptions } from './delivery';
import { EnrollmentsSettingsOptions } from './enrollments';
import { Modules } from './modules';
import { OrdersSettingsOptions } from './orders';
import { PaymentProvidersSettingsOptions } from './payments';
import { QuotationsSettingsOptions } from './quotations';
import { Services } from './services';
import { User } from './user';
import { Logger } from './logs';

export declare type Root = Record<string, unknown>;

export interface UnchainedUserContext {
  loginToken?: string;
  userId?: string;
  user?: User;
}

export interface UnchainedAPI {
  modules: Modules;
  services: Services;
  version?: string;
}

export interface UnchainedLocaleContext {
  countryContext: string;
  localeContext: Locale;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

export interface UnchainedLoaders {
  bookmarksByQueryLoader: any;
  bookmarkByIdLoader: any;
}

export interface UnchainedBulkImport {
  bulkImporter: any;
}

export type Context = UnchainedAPI &
  UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedBulkImport;

export interface UnchainedServerOptions {
  unchainedAPI: UnchainedAPI;
  bulkImporter?: any;
  rolesOptions?: any;
  typeDefs: Array<string>;
  context?: any;
  interception?: boolean;
  playground?: boolean;
  tracing?: boolean;
}

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: Logger | Console; unchainedAPI: UnchainedAPI }) => Promise<void>;
}

export interface UnchainedCoreOptions {
  db: Db;
  migrationRepository: MigrationRepository<Migration>;
  modules: Record<string, { configure: ({ db }: { db: Db }) => any }>;
  services: Record<string, any>;
  options: {
    accounts?: AccountsSettingsOptions;
    assortments?: AssortmentsSettingsOptions;
    delivery?: DeliverySettingsOptions;
    filters?: { skipInvalidationOnStartup?: boolean };
    enrollments?: EnrollmentsSettingsOptions;
    orders?: OrdersSettingsOptions;
    paymentProviders?: PaymentProvidersSettingsOptions;
    quotations?: QuotationsSettingsOptions;
  };
  [x: string]: any;
}
