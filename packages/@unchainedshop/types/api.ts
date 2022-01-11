import { Locale } from 'locale';
import { Modules } from './modules';
import { User } from './user';

export declare type Root = Record<string, unknown>;

export interface UnchainedUserContext {
  loginToken?: string;
  userId?: string;
  user?: User;
}

export interface UnchainedAPI {
  modules: Modules;
  services: any;
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
  bulkImporter: any
}

export type Context = UnchainedAPI &
  UnchainedUserContext &
  UnchainedLocaleContext &
  UnchainedLoaders &
  UnchainedBulkImport;
