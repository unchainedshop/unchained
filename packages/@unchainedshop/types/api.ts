import { IncomingMessage, OutgoingMessage } from 'http';
import { GraphQLOptions } from 'apollo-server-express';
import { FilesSettingsOptions } from './files';
import { Db, Locale, MigrationRepository, ModuleInput } from './common';
import { AccountsSettingsOptions } from './accounts';
import { AssortmentsSettingsOptions } from './assortments';
import { DeliverySettingsOptions } from './delivery';
import { EnrollmentsSettingsOptions } from './enrollments';
import { Modules } from './modules';
import { OrdersSettingsOptions } from './orders';
import { PaymentSettingsOptions } from './payments';
import { QuotationsSettingsOptions } from './quotations';
import { Services } from './services';
import { User } from './user';
import { Logger } from './logs';
import { FiltersSettingsOptions } from './filters';
import { ProductsSettingsOptions } from './products';

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
  roles: any;
}

export interface UnchainedHTTPServerContext {
  req: IncomingMessage;
  res: OutgoingMessage;
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
  productTextLoader: any;
}

export type Context = UnchainedAPI &
  UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedHTTPServerContext;

export type UnchainedServerOptions = {
  unchainedAPI: UnchainedAPI;
  roles?: any;
  typeDefs: Array<string>;
  resolvers: Record<string, any>;
  context?: any;
  tracing?: boolean;
  schema?: any;
  plugins?: any[];
  cache: any;
  cacheControl?: any;
  corsOrigins: any;
  introspection: boolean;
  playground: boolean;
} & Omit<
  GraphQLOptions<any, any>,
  'context' | 'uploads' | 'formatError' | 'typeDefs' | 'resolvers' | 'cors' | 'schema' | 'schemaHash'
>;

export interface Migration {
  id: number;
  name: string;
  up: (params: { logger: Logger | Console; unchainedAPI: UnchainedAPI }) => Promise<void>;
}

export interface UnchainedCoreOptions {
  db: Db;
  migrationRepository: MigrationRepository<Migration>;
  modules: Record<
    string,
    {
      configure: (params: ModuleInput<any>) => any;
    }
  >;
  services: Record<string, any>;
  options: {
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
  };
  [x: string]: any;
}
