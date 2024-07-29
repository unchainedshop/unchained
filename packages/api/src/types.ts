import type DataLoader from 'dataloader';

import { Locale } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import { User } from '@unchainedshop/core-users';
import { Product, ProductText } from '@unchainedshop/types/products.js';
import { ProductMediaText } from '@unchainedshop/types/products.media.js';
import { Filter, FilterText } from '@unchainedshop/core-filters';
import {
  Assortment,
  AssortmentLink,
  AssortmentProduct,
  AssortmentText,
} from '@unchainedshop/core-assortments';
import { AssortmentMediaText } from '@unchainedshop/core-assortments';
import { File } from '@unchainedshop/core-files';

export interface UnchainedUserContext {
  login: (user: User) => Promise<{ _id: string; tokenExpires: Date }>;
  logout: () => Promise<boolean>;
  userId?: string;
  user?: User;
  remoteAddress?: string;
  remotePort?: string;
  userAgent?: string;
}

export interface CustomAdminUiProperties {
  entityName: string;
  inlineFragment: string;
}

export interface AdminUiConfig {
  customProperties?: CustomAdminUiProperties[];
}

export interface UnchainedLocaleContext {
  countryContext: string;
  localeContext: Locale;
  currencyContext: string;
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
    assortmentLinksLoader: InstanceType<
      typeof DataLoader<{ parentAssortmentId?: string; assortmentId?: string }, AssortmentLink[]>
    >;
    assortmentProductLoader: InstanceType<
      typeof DataLoader<{ assortmentId: string; productId: string }, AssortmentProduct>
    >;
    assortmentMediaTextLoader: InstanceType<
      typeof DataLoader<{ assortmentMediaId: string; locale: string }, AssortmentMediaText>
    >;
  };
}

export type UnchainedHTTPServerContext = {
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | string[];
};

export type Context = UnchainedCore & {
  version?: string;
  roles?: any;
  adminUiConfig?: AdminUiConfig;
} & UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedHTTPServerContext;
