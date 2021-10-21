declare module 'meteor/unchained:utils' {
  export const resolveBestSupported: any;
  export const systemLocale: any;
  export const resolveBestCountry: any;
  export const getContext: any;
  export type checkId = (value:string, error?: any) => void
  export const resolveUserRemoteAddress: {
    remoteAddress?: string;
    remotePort?: string;
  };
}
