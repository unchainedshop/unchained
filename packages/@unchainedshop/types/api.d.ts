import { Modules } from '.';

export declare type Root = Record<string, unknown>;
export declare interface Context {
  services: any;
  modules: Modules;
  userId: string;
}
