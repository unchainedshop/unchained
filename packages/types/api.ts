import { IncomingMessage, OutgoingMessage } from 'http';
import { GraphQLOptions } from 'apollo-server-express';
import type { Locale } from 'locale';
import { User } from './user';
import { UnchainedCore } from './core';

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
    productTextLoader: any;
    filterTextLoader: any;
    assortmentTextLoader: any;
  };
}

export interface UnchainedHTTPServerContext {
  req: IncomingMessage;
  res: OutgoingMessage;
}

export type UnchainedAPI = UnchainedCore;

export type Context = UnchainedCore & {
  version?: string;
  roles?: any;
} & UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedHTTPServerContext;

export type UnchainedContextResolver = (params: UnchainedHTTPServerContext) => Promise<Context>;

export type UnchainedServerOptions = {
  unchainedAPI: UnchainedCore;
  expressApp: any;
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
