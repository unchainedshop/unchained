import { Locale } from '@types/locale';
import { Modules } from './modules';

export declare type Root = Record<string, unknown>;
export declare interface Context {
  countryContext: string;
  localeContext: Locale;
  loginToken?: string;
  modules: Modules;
  remoteAddress: string;
  remotePort: string;
  services: any;
  userAgent: string;
  userId?: string;
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