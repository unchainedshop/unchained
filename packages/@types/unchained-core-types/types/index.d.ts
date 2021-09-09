export { BookmarksModule } from './bookmarks';
export { EventsModule, EventDirector } from './events';
export { LogLevel, LogsModule, LogOptions, Log } from './logs';
export { Modules } from './modules'

declare module 'meteor/unchained:utils' {
  export const resolveBestSupported: any;
  export const systemLocale: any;
  export const resolveBestCountry: any;
  export const getContext: any;
  export const resolveUserRemoteAddress: {
    remoteAddress?: string;
    remotePort?: string;
  };
}
