import { Locale } from '@types/locale';
import { Modules } from './modules';

export declare type Root = Record<string, unknown>;
export declare interface Context {
  services: any;
  modules: Modules;
  userId: string;
  localeContext: Locale
  countryContext: string
}

export interface UnchainedAPI {
  services: any;
  modules: Modules;
  version: string;
}

export interface LocaleContext {
  localeContext: Locale,
  countryContext: string,
}