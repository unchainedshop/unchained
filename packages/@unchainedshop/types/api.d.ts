import { Locale } from '@types/locale';
import { Modules } from './modules';

export declare type Root = Record<string, unknown>;
export declare interface Context {
  services: any;
  modules: Modules;
  userId: string;

  localeContext: Locale
}