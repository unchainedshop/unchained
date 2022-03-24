import { IncomingMessage, OutgoingMessage } from 'http';
import { GraphQLOptions } from 'apollo-server-express';
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
import { FilesSettingsOptions } from '@unchainedshop/types/files';

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
}

export interface UnchainedBulkImport {
  bulkImporter: any;
}

export type Context = UnchainedAPI &
  UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedBulkImport &
  UnchainedHTTPServerContext;

export type UnchainedServerOptions = {
  unchainedAPI: UnchainedAPI;
  bulkImporter?: any;
  rolesOptions?: any;
  typeDefs: Array<string>;
  resolvers: Record<string, any>;
  context?: any;
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
  modules: Record<string, { configure: ({ db }: { db: Db }) => any }>;
  services: Record<string, any>;
  options: {
    accounts?: AccountsSettingsOptions;
    assortments?: AssortmentsSettingsOptions;
    delivery?: DeliverySettingsOptions;
    filters?: { skipInvalidationOnStartup?: boolean };
    enrollments?: EnrollmentsSettingsOptions;
    orders?: OrdersSettingsOptions;
    quotations?: QuotationsSettingsOptions;
    files?: FilesSettingsOptions;
    payment?: PaymentProvidersSettingsOptions;
  };
  [x: string]: any;
}
