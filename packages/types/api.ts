import type { IncomingMessage, OutgoingMessage } from 'http';
import type { ApolloServerOptions } from '@apollo/server';
import type { Locale } from 'locale';
import { User } from './user.js';
import { UnchainedCore } from './core.js';

export declare type Root = Record<string, unknown>;

export interface UnchainedUserContext {
  login: (user: User) => Promise<{ _id: string; tokenExpires: Date }>;
  logout: (sessionId?: string) => Promise<void>;
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
  context?: any;
  events: Array<string>;
  workTypes: Array<string>;
  adminUiConfig?: AdminUiConfig;
} & ApolloServerOptions<Context>;
