import type { Locale, Locales } from 'locale';

export { Locale, Locales };

/*
 * Data definitions
 */

export type Configuration = Array<{ key: string; value: string }>;

export type LogFields = {
  log: Array<{
    date: Date;
    status?: string;
    info: string;
  }>;
};

export type TimestampFields = {
  created?: Date;
  updated?: Date;
  deleted?: Date;
};

export interface Address {
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface Contact {
  telNumber?: string;
  emailAddress?: string;
}

/*
 * Adapter & Director
 */

export enum LogLevel {
  Verbose = 'verbose',
  Info = 'info',
  Debug = 'debug',
  Error = 'error',
  Warning = 'warn',
}

export interface IBaseAdapter {
  key: string;
  label: string;
  version: string;
  log: (
    message: string,
    options?: {
      level?: LogLevel;
      [x: string]: any;
    },
  ) => void;
}

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Array<Adapter>;
  getAdapter: (key: string) => Adapter;
  registerAdapter: (A: Adapter) => void;
  unregisterAdapter: (key: string) => boolean;
}

export type NodeOrTree<T> = string | Tree<T>; // eslint-disable-line
export type Tree<T> = Array<NodeOrTree<T>>;
