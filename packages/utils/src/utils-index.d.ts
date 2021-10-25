import SimpleSchema from "simpl-schema";
import { ModuleMutations } from "unchained-core-types";

declare module 'meteor/unchained:utils' {
  export const resolveBestSupported: any;
  export const systemLocale: any;
  export const resolveBestCountry: any;
  export type checkId = (value:string, error?: any) => void
  export type generateDbMutations = <T>(collection: any, schema: SimpleSchema) => ModuleMutations<T>
  export const resolveUserRemoteAddress: {
    remoteAddress?: string;
    remotePort?: string;
  };
}
