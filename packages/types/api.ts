import type { IncomingMessage, OutgoingMessage } from 'http';
import type { ApolloServerOptions } from '@apollo/server';
import type { Locale } from 'locale';
import type DataLoader from 'dataloader';
import { User } from './user.js';
import { UnchainedCore } from './core.js';
import { Assortment, AssortmentLink, AssortmentText } from './assortments.js';
import { AssortmentMediaText } from './assortments.media.js';
import { Filter, FilterText } from './filters.js';
import { File } from './files.js';
import { Product, ProductText } from './products.js';
import { ProductMediaText } from './products.media.js';

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
    productLoader: InstanceType<typeof DataLoader<{ productId: string }, Product>>;
    productTextLoader: InstanceType<
      typeof DataLoader<{ productId: string; locale: string }, ProductText>
    >;
    productMediaTextLoader: InstanceType<
      typeof DataLoader<{ productMediaId: string; locale: string }, ProductMediaText>
    >;

    fileLoader: InstanceType<typeof DataLoader<{ fileId: string }, File>>;

    filterLoader: InstanceType<typeof DataLoader<{ filterId: string }, Filter>>;
    filterTextLoader: InstanceType<
      typeof DataLoader<{ filterId: string; filterOptionValue?: string; locale: string }, FilterText>
    >;

    assortmentLoader: InstanceType<typeof DataLoader<{ assortmentId: string }, Assortment>>;
    assortmentTextLoader: InstanceType<
      typeof DataLoader<{ assortmentId: string; locale: string }, AssortmentText>
    >;
    assortmentLinkLoader: InstanceType<
      typeof DataLoader<{ parentAssortmentId: string; childAssortmentId: string }, AssortmentLink>
    >;
    assortmentMediaTextLoader: InstanceType<
      typeof DataLoader<{ assortmentMediaId: string; locale: string }, AssortmentMediaText>
    >;
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
