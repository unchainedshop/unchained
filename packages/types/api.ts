import { IncomingMessage, OutgoingMessage } from 'http';
import { GraphQLOptions } from 'apollo-server-express';
import type { Locale } from 'locale';
import { User } from './user';
import { UnchainedCore } from './core';

export declare type Root = Record<string, unknown>;

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
export interface UnchainedUserContext {
  loginToken?: string;
  userId?: string;
  user?: User;
}

export interface UnchainedAPI extends UnchainedCore {
  version?: string;
  roles?: any;
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
    productTextLoader: any;
    filterTextLoader: any;
    assortmentTextLoader: any;
  };
}

export interface UnchainedHTTPServerContext {
  req: IncomingMessage;
  res: OutgoingMessage;
}

export type Context = UnchainedAPI &
  UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedHTTPServerContext;

export type UnchainedContextResolver = (params: UnchainedHTTPServerContext) => Promise<Context>;

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
