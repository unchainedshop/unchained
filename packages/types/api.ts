import { IncomingMessage, OutgoingMessage } from 'http';
import { ApolloServerOptions } from '@apollo/server';
import type { Locale } from 'locale';
import { User } from './user.js';
import { UnchainedCore } from './core.js';

export declare type Root = Record<string, unknown>;

export interface UnchainedUserContext {
  loginToken?: string;
  setLoginToken: (token: string, expires?: Date) => void;
  userId?: string;
  user?: User;
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type SortOption = {
  key: string;
  value: SortDirection;
};

export interface UnchainedLocaleContext {
  countryContext: string;
  localeContext: Locale;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

export interface UnchainedLoaders {
  loaders: {
    productLoader: any;
    productTextLoader: any;
    filterLoader: any;
    filterTextLoader: any;
    assortmentTextLoader: any;
    assortmentLoader: any;
  };
}

export interface UnchainedHTTPServerContext {
  req: IncomingMessage;
  res: OutgoingMessage;
}

export interface CustomAdminUiProperties {
  entityName: string;
  inlineFragment: string;
}
export interface AdminUiConfig {
  customProperties?: CustomAdminUiProperties[];
}

export type Context = UnchainedCore & {
  version?: string;
  roles?: any;
  adminUiConfig?: AdminUiConfig;
} & UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedHTTPServerContext;

export type UnchainedContextResolver = (params: UnchainedHTTPServerContext) => Promise<Context>;

export type UnchainedServerOptions = {
  unchainedAPI: UnchainedCore;
  roles?: any;
  events: Array<string>;
  workTypes: Array<string>;
  typeDefs?: Array<string>;
  resolvers?: Record<string, any>;
  context?: any;
  tracing?: boolean;
  schema?: any;
  plugins?: any[];
  cache: any;
  cacheControl?: any;
  introspection: boolean;
  playground: boolean;
  adminUiConfig?: AdminUiConfig;
} & Omit<
  ApolloServerOptions<Context>,
  'context' | 'uploads' | 'formatError' | 'typeDefs' | 'resolvers' | 'cors' | 'schema' | 'schemaHash'
>;
